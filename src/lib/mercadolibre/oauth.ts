import { countries, type CountryCode } from "@/lib/countries";

type MeliOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authUrl: string;
};

export function isMeliPkceEnabled() {
  return process.env.MELI_USE_PKCE === "true";
}

export function getMeliOAuthConfig(country: CountryCode): MeliOAuthConfig {
  if (country !== "AR" && country !== "CL") {
    throw new Error(`OAuth todavía no está habilitado para ${country}.`);
  }

  const clientId = process.env.MELI_CLIENT_ID;
  const clientSecret = process.env.MELI_CLIENT_SECRET;
  const baseUrl = process.env.MELI_OAUTH_REDIRECT_BASE_URL;

  if (!clientId || !clientSecret || !baseUrl) {
    throw new Error(`Falta configurar OAuth de Mercado Libre para ${country}.`);
  }

  return {
    clientId,
    clientSecret,
    redirectUri: `${baseUrl}/api/mercadolibre/callback`,
    authUrl: countries[country].authUrl,
  };
}

export async function exchangeAuthorizationCode(
  country: CountryCode,
  code: string,
  codeVerifier?: string,
) {
  const config = getMeliOAuthConfig(country);
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: config.redirectUri,
  });
  if (codeVerifier) body.set("code_verifier", codeVerifier);

  const response = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Mercado Libre rechazó el código OAuth (${response.status}).`);
  }

  return (await response.json()) as {
    access_token: string;
    user_id: number;
    expires_in: number;
  };
}

export async function fetchMeliUser(accessToken: string) {
  const response = await fetch("https://api.mercadolibre.com/users/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`No se pudo verificar el seller (${response.status}).`);
  }

  return (await response.json()) as {
    id: number;
    nickname: string;
    site_id: string;
  };
}
