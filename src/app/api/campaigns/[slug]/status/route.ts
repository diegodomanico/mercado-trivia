import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  publicationProofCookie,
  readPublicationProof,
  readSellerProof,
  sellerProofCookie,
} from "@/lib/mercadolibre/verification";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const admin = createSupabaseAdminClient();
    const { data: campaign } = await admin
      .from("campaigns")
      .select("id,country_code,status,terms_version")
      .eq("slug", slug)
      .single();
    if (!campaign) return NextResponse.json({ error: "Campaña inexistente." }, { status: 404 });

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const sellerProof = readSellerProof(request.cookies.get(sellerProofCookie)?.value);
    const publicationProof = readPublicationProof(request.cookies.get(publicationProofCookie)?.value);
    const temporarySeller = sellerProof?.campaign === slug && sellerProof.country === campaign.country_code;
    const temporaryPublication = publicationProof?.campaign === slug && publicationProof.country === campaign.country_code;

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        phoneVerified: false,
        sellerVerified: Boolean(temporarySeller),
        sellerNickname: temporarySeller ? sellerProof.nickname : null,
        publicationVerified: Boolean(temporaryPublication),
        publicationTitle: temporaryPublication ? publicationProof.title : null,
        consentAccepted: false,
        legalReady: Boolean(campaign.terms_version),
        campaignStatus: campaign.status,
      });
    }

    const [{ data: seller }, { data: publication }, { data: consent }] = await Promise.all([
      admin.from("seller_verifications").select("id,nickname").eq("user_id", user.id).eq("country_code", campaign.country_code).maybeSingle(),
      admin.from("verified_publications").select("id,title").eq("user_id", user.id).eq("campaign_id", campaign.id).maybeSingle(),
      admin.from("consent_acceptances").select("id").eq("user_id", user.id).eq("campaign_id", campaign.id).maybeSingle(),
    ]);

    return NextResponse.json({
      authenticated: true,
      phoneVerified: Boolean(user.phone_confirmed_at),
      sellerVerified: Boolean(seller || temporarySeller),
      sellerNickname: seller?.nickname ?? (temporarySeller ? sellerProof.nickname : null),
      publicationVerified: Boolean(publication || temporaryPublication),
      publicationTitle: publication?.title ?? (temporaryPublication ? publicationProof.title : null),
      consentAccepted: Boolean(consent),
      legalReady: Boolean(campaign.terms_version),
      campaignStatus: campaign.status,
    });
  } catch {
    return NextResponse.json({ error: "No se pudo consultar el estado." }, { status: 500 });
  }
}
