import { countries, type CountryCode } from "@/lib/countries";

const itemPattern = /\b(MLA|MLC|MCO|MLM|MLU)-?(\d{6,})\b/i;

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

export async function fetchMeliItem(itemId: string) {
  const response = await fetch(
    `https://api.mercadolibre.com/items/${encodeURIComponent(itemId)}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(`No se encontró una publicación válida (${response.status}).`);
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
