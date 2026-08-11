import { NextRequest, NextResponse } from "next/server";
import { countries, isCountryCode } from "@/lib/countries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  exchangeAuthorizationCode,
  fetchFirstActiveMeliItemId,
  fetchMeliUser,
  isMeliPkceEnabled,
  MeliOAuthError,
} from "@/lib/mercadolibre/oauth";
import { fetchMeliItem, MeliItemLookupError } from "@/lib/mercadolibre/items";
import {
  createPublicationProof,
  createSellerProof,
  publicationProofCookie,
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
  const providerError = request.nextUrl.searchParams.get("error");
  const savedState = request.cookies.get("meli_oauth_state")?.value;
  const verifier = request.cookies.get("meli_oauth_verifier")?.value;
  const countryValue = request.cookies.get("meli_oauth_country")?.value || "";
  const campaign = request.cookies.get("meli_oauth_campaign")?.value || "";

  if (providerError) {
    return campaignRedirect(request, campaign || "melixp-argentina-2026", { error: "oauth_denied" });
  }

  if (
    !code ||
    !state ||
    state !== savedState ||
    (isMeliPkceEnabled() && !verifier) ||
    !isCountryCode(countryValue) ||
    !campaign
  ) {
    return campaignRedirect(request, campaign || "melixp-chile-2026", { error: "oauth_state" });
  }

  let callbackStage = "session";
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    callbackStage = "token";
    const token = await exchangeAuthorizationCode(countryValue, code, verifier);
    callbackStage = "seller";
    const seller = await fetchMeliUser(token.access_token);
    if (seller.site_id !== countries[countryValue].siteId) {
      return campaignRedirect(request, campaign, { error: "wrong_country" });
    }
    callbackStage = "items";
    const itemId = await fetchFirstActiveMeliItemId(seller.id, token.access_token);
    if (!itemId) {
      return campaignRedirect(request, campaign, { error: "no_active_publication" });
    }
    callbackStage = "item";
    const item = await fetchMeliItem(itemId, token.access_token);
    if (
      String(item.seller_id) !== String(seller.id) ||
      item.site_id !== countries[countryValue].siteId ||
      item.status !== "active"
    ) {
      return campaignRedirect(request, campaign, { error: "invalid_active_publication" });
    }

    if (user) {
      callbackStage = "persistence";
      const admin = createSupabaseAdminClient();
      const { data: campaignRow, error: campaignError } = await admin
        .from("campaigns")
        .select("id")
        .eq("slug", campaign)
        .single();
      if (campaignError || !campaignRow) throw campaignError ?? new Error("Campaign not found");

      const { error: sellerError } = await admin.from("seller_verifications").upsert(
        {
          user_id: user.id,
          country_code: countryValue,
          seller_id: String(seller.id),
          nickname: seller.nickname,
          verified_at: new Date().toISOString(),
        },
        { onConflict: "user_id,country_code" },
      );
      if (sellerError) throw sellerError;

      const { error: publicationError } = await admin.from("verified_publications").upsert(
        {
          user_id: user.id,
          campaign_id: campaignRow.id,
          item_id: item.id,
          seller_id: String(seller.id),
          permalink: item.permalink,
          title: item.title,
          verified_at: new Date().toISOString(),
        },
        { onConflict: "user_id,campaign_id" },
      );
      if (publicationError) throw publicationError;
    }

    const response = campaignRedirect(request, campaign, { meli: "verified" });
    const proofCookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: verificationProofMaxAge,
    };
    callbackStage = "proof";
    response.cookies.set(
      sellerProofCookie,
      createSellerProof({
        country: countryValue,
        campaign,
        sellerId: String(seller.id),
        nickname: seller.nickname,
      }),
      proofCookieOptions,
    );
    response.cookies.set(
      publicationProofCookie,
      createPublicationProof({
        country: countryValue,
        campaign,
        sellerId: String(seller.id),
        itemId: item.id,
        permalink: item.permalink,
        title: item.title,
      }),
      proofCookieOptions,
    );
    response.cookies.delete("meli_oauth_state");
    response.cookies.delete("meli_oauth_verifier");
    response.cookies.delete("meli_oauth_country");
    response.cookies.delete("meli_oauth_campaign");
    return response;
  } catch (error) {
    if (error instanceof MeliOAuthError) {
      console.error("Mercado Libre OAuth callback failed", {
        stage: error.stage,
        status: error.status,
        providerCode: error.providerCode,
      });
      return campaignRedirect(request, campaign, { error: error.publicCode });
    }
    if (error instanceof MeliItemLookupError) {
      console.error("Mercado Libre item lookup failed", { status: error.status });
      return campaignRedirect(request, campaign, { error: `oauth_item_${error.status}` });
    }
    console.error("Mercado Libre OAuth callback failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      stage: callbackStage,
    });
    return campaignRedirect(request, campaign, { error: `oauth_internal_${callbackStage}` });
  }
}
