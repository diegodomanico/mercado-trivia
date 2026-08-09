import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ authenticated: false });
    }

    const admin = createSupabaseAdminClient();
    const { data: campaign } = await admin
      .from("campaigns")
      .select("id,country_code,status,terms_version")
      .eq("slug", slug)
      .single();
    if (!campaign) return NextResponse.json({ error: "Campaña inexistente." }, { status: 404 });

    const [{ data: seller }, { data: publication }, { data: consent }] = await Promise.all([
      admin.from("seller_verifications").select("id,nickname").eq("user_id", user.id).eq("country_code", campaign.country_code).maybeSingle(),
      admin.from("verified_publications").select("id,title").eq("user_id", user.id).eq("campaign_id", campaign.id).maybeSingle(),
      admin.from("consent_acceptances").select("id").eq("user_id", user.id).eq("campaign_id", campaign.id).maybeSingle(),
    ]);

    return NextResponse.json({
      authenticated: true,
      phoneVerified: Boolean(user.phone_confirmed_at),
      sellerVerified: Boolean(seller),
      sellerNickname: seller?.nickname ?? null,
      publicationVerified: Boolean(publication),
      publicationTitle: publication?.title ?? null,
      consentAccepted: Boolean(consent),
      legalReady: Boolean(campaign.terms_version),
      campaignStatus: campaign.status,
    });
  } catch {
    return NextResponse.json({ error: "No se pudo consultar el estado." }, { status: 500 });
  }
}
