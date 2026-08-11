import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSafeSupabaseErrorCode } from "@/lib/supabase/errors";
import {
  publicationProofCookie,
  readPublicationProof,
  readSellerProof,
  sellerProofCookie,
} from "@/lib/mercadolibre/verification";

const bodySchema = z.object({
  whatsapp: z.preprocess(
    (value) => typeof value === "string" ? value.replace(/[^\d+]/g, "") : value,
    z.string().regex(/^\+[1-9][0-9]{7,14}$/),
  ),
});

export async function POST(request: NextRequest) {
  try {
    const body = bodySchema.parse(await request.json());
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email || !user.email_confirmed_at) {
      return NextResponse.json({ error: "Primero validá tu correo." }, { status: 401 });
    }

    const seller = readSellerProof(request.cookies.get(sellerProofCookie)?.value);
    const publication = readPublicationProof(request.cookies.get(publicationProofCookie)?.value);
    if (
      !seller ||
      !publication ||
      seller.country !== publication.country ||
      seller.campaign !== publication.campaign ||
      seller.sellerId !== publication.sellerId
    ) {
      return NextResponse.json({ error: "La validación de Mercado Libre venció o no coincide." }, { status: 409 });
    }

    const admin = createSupabaseAdminClient();
    const { data: campaign, error: campaignError } = await admin
      .from("campaigns")
      .select("id")
      .eq("slug", seller.campaign)
      .eq("country_code", seller.country)
      .single();
    if (campaignError && campaignError.code !== "PGRST116") {
      console.error("Claim campaign lookup failed", campaignError);
      return NextResponse.json(
        { error: "No se pudo consultar la campaña.", code: getSafeSupabaseErrorCode(campaignError) },
        { status: 503 },
      );
    }
    if (!campaign) return NextResponse.json({ error: "Campaña inexistente." }, { status: 404 });

    const { error: sellerError } = await admin.from("seller_verifications").upsert(
      {
        user_id: user.id,
        country_code: seller.country,
        seller_id: seller.sellerId,
        nickname: seller.nickname,
        verified_at: new Date().toISOString(),
      },
      { onConflict: "user_id,country_code" },
    );
    if (sellerError) throw sellerError;

    const { error: publicationError } = await admin.from("verified_publications").upsert(
      {
        user_id: user.id,
        campaign_id: campaign.id,
        item_id: publication.itemId,
        seller_id: seller.sellerId,
        permalink: publication.permalink,
        title: publication.title,
        verified_at: new Date().toISOString(),
      },
      { onConflict: "user_id,campaign_id" },
    );
    if (publicationError) throw publicationError;

    const { error: contactError } = await admin.from("participant_contacts").upsert(
      {
        user_id: user.id,
        campaign_id: campaign.id,
        email: user.email.toLowerCase(),
        whatsapp_e164: body.whatsapp,
        email_verified_at: user.email_confirmed_at,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,campaign_id" },
    );
    if (contactError) throw contactError;

    const response = NextResponse.json({ ok: true });
    response.cookies.delete(sellerProofCookie);
    response.cookies.delete(publicationProofCookie);
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ingresá el WhatsApp con código de país, por ejemplo +5411..." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "No se pudo vincular la validación comercial." }, { status: 500 });
  }
}
