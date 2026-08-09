import { NextRequest, NextResponse } from "next/server";
import { countries, isCountryCode } from "@/lib/countries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { exchangeAuthorizationCode, fetchMeliUser } from "@/lib/mercadolibre/oauth";
import {
  createSellerProof,
  sellerProofCookie,
  verificationProofMaxAge,
} from "@/lib/mercadolibre/verification";

export const dynamic = "force-dynamic";

function campaignRedirect(request: NextRequest, campaign: string, params: Record<string, string>) {
  const url = new URL(`/campanas/${campaign}`, request.url);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const savedState = request.cookies.get("meli_oauth_state")?.value;
  const countryValue = request.cookies.get("meli_oauth_country")?.value || "";
  const campaign = request.cookies.get("meli_oauth_campaign")?.value || "";

  if (!code || !state || state !== savedState || !isCountryCode(countryValue) || !campaign) {
    return campaignRedirect(request, campaign || "melixp-chile-2026", { error: "oauth_state" });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const token = await exchangeAuthorizationCode(countryValue, code);
    const seller = await fetchMeliUser(token.access_token);
    if (seller.site_id !== countries[countryValue].siteId) {
      return campaignRedirect(request, campaign, { error: "wrong_country" });
    }

    if (user) {
      const admin = createSupabaseAdminClient();
      const { error } = await admin.from("seller_verifications").upsert(
        {
          user_id: user.id,
          country_code: countryValue,
          seller_id: String(seller.id),
          nickname: seller.nickname,
          verified_at: new Date().toISOString(),
        },
        { onConflict: "user_id,country_code" },
      );
      if (error) throw error;
    }

    const response = campaignRedirect(request, campaign, { meli: "verified" });
    response.cookies.set(
      sellerProofCookie,
      createSellerProof({
        country: countryValue,
        campaign,
        sellerId: String(seller.id),
        nickname: seller.nickname,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: verificationProofMaxAge,
      },
    );
    response.cookies.delete("meli_oauth_state");
    response.cookies.delete("meli_oauth_country");
    response.cookies.delete("meli_oauth_campaign");
    return response;
  } catch {
    return campaignRedirect(request, campaign, { error: "oauth_failed" });
  }
}
