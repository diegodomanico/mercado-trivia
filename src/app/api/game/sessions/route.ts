import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { countries } from "@/lib/countries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hashGuestToken } from "@/lib/game/access";
import {
  presentQuestion,
  selectGameQuestions,
  shuffledOptionOrder,
  type QuestionRecord,
} from "@/lib/game/selection";

const bodySchema = z.object({
  mode: z.enum(["practice", "campaign"]),
  country: z.enum(["AR", "CL", "CO", "MX", "UY"]),
  campaign: z.string().regex(/^[a-z0-9-]+$/).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const input = bodySchema.parse(await request.json());
    const admin = createSupabaseAdminClient();
    let userId: string | null = null;
    let campaignId: string | null = null;
    let guestToken: string | null = null;

    if (input.mode === "campaign") {
      if (!input.campaign) {
        return NextResponse.json({ error: "Falta identificar la campaña." }, { status: 400 });
      }
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: "Validá tu identidad primero." }, { status: 401 });
      userId = user.id;

      const { data: campaign } = await admin
        .from("campaigns")
        .select("id,country_code,status")
        .eq("slug", input.campaign)
        .eq("country_code", input.country)
        .eq("status", "active")
        .single();
      if (!campaign) return NextResponse.json({ error: "La campaña no está abierta." }, { status: 403 });
      campaignId = campaign.id;

      const [{ data: seller }, { data: publication }, { data: consent }] = await Promise.all([
        admin.from("seller_verifications").select("id").eq("user_id", user.id).eq("country_code", input.country).maybeSingle(),
        admin.from("verified_publications").select("id").eq("user_id", user.id).eq("campaign_id", campaign.id).maybeSingle(),
        admin.from("consent_acceptances").select("id").eq("user_id", user.id).eq("campaign_id", campaign.id).maybeSingle(),
      ]);
      if (!seller || !publication || !consent) {
        return NextResponse.json({ error: "Completá identidad, publicación y consentimiento." }, { status: 403 });
      }
    } else {
      guestToken = randomBytes(32).toString("base64url");
    }

    const { data: questionRows, error: questionError } = await admin
      .from("questions")
      .select("id,competency_id,difficulty,applicable_countries,prompt,options")
      .eq("status", "approved")
      .limit(1000);
    if (questionError) throw questionError;

    const selected = selectGameQuestions(
      (questionRows ?? []) as QuestionRecord[],
      input.country,
    );
    const prepared = selected.map((question, index) => ({
      question,
      position: index + 1,
      optionOrder: shuffledOptionOrder(),
    }));

    const { data: session, error: sessionError } = await admin
      .from("game_sessions")
      .insert({
        mode: input.mode,
        campaign_id: campaignId,
        country_code: input.country,
        user_id: userId,
        guest_token_hash: guestToken ? hashGuestToken(guestToken) : null,
        status: "playing",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (sessionError) {
      if (sessionError.code === "23505") {
        return NextResponse.json({ error: "Ya existe una participación para esta campaña." }, { status: 409 });
      }
      throw sessionError;
    }

    const { error: questionsError } = await admin.from("game_session_questions").insert(
      prepared.map(({ question, position, optionOrder }) => ({
        session_id: session.id,
        question_id: question.id,
        position,
        option_order: optionOrder,
        presented_at: position === 1 ? new Date().toISOString() : null,
      })),
    );
    if (questionsError) {
      await admin.from("game_sessions").delete().eq("id", session.id);
      throw questionsError;
    }

    const first = prepared[0];
    const response = NextResponse.json({
      sessionId: session.id,
      totalQuestions: 25,
      country: countries[input.country].name,
      question: presentQuestion(first.question, first.optionOrder, first.position),
    });
    if (guestToken) {
      response.cookies.set("practice_session", `${session.id}.${guestToken}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api/game",
        maxAge: 60 * 60,
      });
    }
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Configuración de partida inválida." }, { status: 400 });
    }
    const message = error instanceof Error && error.message.startsWith("Banco incompleto")
      ? error.message
      : "No se pudo iniciar la partida.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
