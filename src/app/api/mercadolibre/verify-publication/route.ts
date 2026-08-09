import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { countries } from "@/lib/countries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchMeliItem, itemBelongsToCountry, parseMeliItemId } from "@/lib/mercadolibre/items";

const bodySchema = z.object({
  campaign: z.string().regex(/^[a-z0-9-]{3,80}$/),
  publication: z.string().min(8).max(500),
});

export async function POST(request: NextRequest) {
  try {
    const body = bodySchema.parse(await request.json());
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Primero validá tu WhatsApp." }, { status: 401 });

    const admin = createSupabaseAdminClient();
    const { data: campaign, error: campaignError } = await admin
      .from("campaigns")
      .select("id,country_code")
      .eq("slug", body.campaign)
      .eq("status", "active")
      .single();
    if (campaignError || !campaign) {
      return NextResponse.json({ error: "La campaña todavía no está habilitada." }, { status: 404 });
    }

    const country = campaign.country_code as keyof typeof countries;
    const { data: seller } = await admin
      .from("seller_verifications")
      .select("seller_id")
      .eq("user_id", user.id)
      .eq("country_code", country)
      .single();
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

    return NextResponse.json({ ok: true, title: item.title });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "El link de publicación no es válido." }, { status: 400 });
    }
    return NextResponse.json({ error: "No se pudo comprobar la publicación." }, { status: 500 });
  }
}
