import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCampaign } from "@/lib/campaigns";
import { isCountryCode } from "@/lib/countries";
import { getMeliOAuthConfig, isMeliPkceEnabled } from "@/lib/mercadolibre/oauth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const countryParam = request.nextUrl.searchParams.get("country") || "";
  const campaignSlug = request.nextUrl.searchParams.get("campaign") || "";
  const campaign = getCampaign(campaignSlug);

  if (
    !isCountryCode(countryParam) ||
    !campaign ||
    campaign.country !== countryParam ||
    (countryParam !== "AR" && countryParam !== "CL")
  ) {
    return NextResponse.json({ error: "Campaña o país inválido." }, { status: 400 });
  }

  try {
    const config = getMeliOAuthConfig(countryParam);
    const state = randomBytes(32).toString("base64url");
    const verifier = isMeliPkceEnabled()
      ? randomBytes(64).toString("base64url")
      : null;
    const authorizeUrl = new URL(config.authUrl);
    const authorizeParams = new URLSearchParams({
      response_type: "code",
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      state,
    });
    if (verifier) {
      authorizeParams.set("code_challenge", createHash("sha256").update(verifier).digest("base64url"));
      authorizeParams.set("code_challenge_method", "S256");
    }
    authorizeUrl.search = authorizeParams.toString();

    const response = NextResponse.redirect(authorizeUrl);
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/api/mercadolibre",
      maxAge: 10 * 60,
    };
    response.cookies.set("meli_oauth_state", state, cookieOptions);
    if (verifier) response.cookies.set("meli_oauth_verifier", verifier, cookieOptions);
    response.cookies.set("meli_oauth_country", countryParam, cookieOptions);
    response.cookies.set("meli_oauth_campaign", campaignSlug, cookieOptions);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "OAuth no disponible." },
      { status: 503 },
    );
  }
}
