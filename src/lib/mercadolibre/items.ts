import { countries, type CountryCode } from "@/lib/countries";

const itemPattern = /\b(MLA|MLC|MCO|MLM|MLU)-?(\d{6,})\b/i;

export class MeliItemLookupError extends Error {
  constructor(public readonly status: number) {
    super(`Mercado Libre item lookup failed (${status}).`);
    this.name = "MeliItemLookupError";
  }
}

export function parseMeliItemId(value: string) {
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    // Keep the original input when it is not URL encoded.
  }

  const match = decoded.match(itemPattern);
  if (!match) return null;
  return `${match[1].toUpperCase()}${match[2]}`;
}

export async function fetchMeliItem(itemId: string, accessToken?: string) {
  const response = await fetch(
    `https://api.mercadolibre.com/items/${encodeURIComponent(itemId)}`,
    {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new MeliItemLookupError(response.status);
  }

  return (await response.json()) as {
    id: string;
    seller_id: number;
    site_id: string;
    status: string;
    permalink: string;
    title: string;
  };
}

export function itemBelongsToCountry(itemId: string, country: CountryCode) {
  return itemId.startsWith(countries[country].siteId);
}
