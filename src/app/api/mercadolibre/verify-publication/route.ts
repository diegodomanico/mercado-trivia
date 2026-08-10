import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { countries } from "@/lib/countries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSafeSupabaseErrorCode } from "@/lib/supabase/errors";
import { fetchMeliItem, itemBelongsToCountry, parseMeliItemId } from "@/lib/mercadolibre/items";
import {
  createPublicationProof,
  publicationProofCookie,
  readSellerProof,
  sellerProofCookie,
  verificationProofMaxAge,
} from "@/lib/mercadolibre/verification";

const bodySchema = z.object({
  campaign: z.string().regex(/^[a-z0-9-]{3,80}$/),
  publication: z.string().min(8).max(500),
});

export async function POST(request: NextRequest) {
  try {
    const body = bodySchema.parse(await request.json());
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const admin = createSupabaseAdminClient();
    const { data: campaign, error: campaignError } = await admin
      .from("campaigns")
      .select("id,country_code")
      .eq("slug", body.campaign)
      .in("status", ["draft", "active"])
      .single();
    if (campaignError && campaignError.code !== "PGRST116") {
      console.error("Publication campaign lookup failed", campaignError);
      return NextResponse.json(
        { error: "No se pudo consultar la campaña.", code: getSafeSupabaseErrorCode(campaignError) },
        { status: 503 },
      );
    }
    if (!campaign) {
      return NextResponse.json({ error: "La campaña todavía no está habilitada." }, { status: 404 });
    }

    const country = campaign.country_code as keyof typeof countries;
    const { data: savedSeller } = user
      ? await admin
        .from("seller_verifications")
        .select("seller_id")
        .eq("user_id", user.id)
        .eq("country_code", country)
        .maybeSingle()
      : { data: null };
    const sellerProof = readSellerProof(request.cookies.get(sellerProofCookie)?.value);
    const proofMatches = sellerProof?.country === country && sellerProof.campaign === body.campaign;
    const seller = savedSeller ?? (proofMatches ? { seller_id: sellerProof.sellerId } : null);
    if (!seller) return NextResponse.json({ error: "Primero conectá Mercado Libre." }, { status: 403 });

    const itemId = parseMeliItemId(body.publication);
    if (!itemId || !itemBelongsToCountry(itemId, country)) {
      return NextResponse.json({ error: `La publicación debe pertenecer a ${countries[country].name}.` }, { status: 400 });
    }

    const item = await fetchMeliItem(itemId);
    if (String(item.seller_id) !== seller.seller_id) {
      return NextResponse.json({ error: "La publicación no pertenece al seller autenticado." }, { status: 403 });
    }
    if (item.status !== "active") {
      return NextResponse.json({ error: "La publicación debe estar activa." }, { status: 400 });
    }

    if (user) {
      const { error: saveError } = await admin.from("verified_publications").upsert(
        {
          user_id: user.id,
          campaign_id: campaign.id,
          item_id: item.id,
          permalink: item.permalink,
          title: item.title,
          seller_id: seller.seller_id,
          verified_at: new Date().toISOString(),
        },
        { onConflict: "user_id,campaign_id" },
      );
      if (saveError) throw saveError;
    }

    const response = NextResponse.json({ ok: true, title: item.title });
    response.cookies.set(
      publicationProofCookie,
      createPublicationProof({
        country,
        campaign: body.campaign,
        sellerId: seller.seller_id,
        itemId: item.id,
        permalink: item.permalink,
        title: item.title,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: verificationProofMaxAge,
      },
    );
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "El link de publicación no es válido." }, { status: 400 });
    }
    return NextResponse.json({ error: "No se pudo comprobar la publicación." }, { status: 500 });
  }
}
