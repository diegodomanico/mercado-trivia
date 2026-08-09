import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const consentSchema = z.object({
  acceptTerms: z.literal(true),
  acceptPrivacy: z.literal(true),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    consentSchema.parse(await request.json());
    const { slug } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sesión requerida." }, { status: 401 });

    const admin = createSupabaseAdminClient();
    const { data: campaign } = await admin
      .from("campaigns")
      .select("id,terms_version")
      .eq("slug", slug)
      .single();
    if (!campaign?.terms_version) {
      return NextResponse.json({ error: "Las bases todavía no fueron publicadas." }, { status: 409 });
    }

    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ipHash = createHash("sha256")
      .update(`${forwarded}:${process.env.APP_SIGNING_SECRET || "local"}`)
      .digest("hex");
    const { error } = await admin.from("consent_acceptances").upsert(
      {
        user_id: user.id,
        campaign_id: campaign.id,
        terms_version: campaign.terms_version,
        privacy_version: campaign.terms_version,
        ip_hash: ipHash,
      },
      { onConflict: "user_id,campaign_id,terms_version,privacy_version" },
    );
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Debés aceptar las bases y la política de privacidad." }, { status: 400 });
    }
    return NextResponse.json({ error: "No se pudo registrar el consentimiento." }, { status: 500 });
  }
}
