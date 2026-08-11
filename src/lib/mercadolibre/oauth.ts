import { countries, type CountryCode } from "@/lib/countries";

type MeliOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authUrl: string;
};

type MeliErrorBody = {
  error?: unknown;
};

export class MeliOAuthError extends Error {
  constructor(
    public readonly stage: "token" | "seller" | "items",
    public readonly status: number,
    public readonly providerCode: string,
  ) {
    super(`Mercado Libre OAuth failed at ${stage} (${status}, ${providerCode}).`);
    this.name = "MeliOAuthError";
  }

  get publicCode() {
    if (this.stage === "token") return `oauth_${this.providerCode}`;
    return `oauth_${this.stage}_${this.status}`;
  }
}

function safeProviderCode(value: unknown): string {
  return typeof value === "string" && /^[a-z0-9_]{2,80}$/.test(value)
    ? value
    : "token_failed";
}

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
    const body = await response.json().catch(() => ({})) as MeliErrorBody;
    throw new MeliOAuthError("token", response.status, safeProviderCode(body.error));
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
    throw new MeliOAuthError("seller", response.status, "seller_failed");
  }

  return (await response.json()) as {
    id: number;
    nickname: string;
    site_id: string;
  };
}

export async function fetchFirstActiveMeliItemId(userId: number, accessToken: string) {
  const url = new URL(`https://api.mercadolibre.com/users/${userId}/items/search`);
  url.searchParams.set("status", "active");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new MeliOAuthError("items", response.status, "items_failed");
  }

  const body = (await response.json()) as { results?: unknown };
  if (!Array.isArray(body.results)) return null;
  const itemId = body.results.find((value): value is string => typeof value === "string");
  return itemId ?? null;
}
