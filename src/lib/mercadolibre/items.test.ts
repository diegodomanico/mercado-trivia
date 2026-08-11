import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchMeliItem, itemBelongsToCountry, parseMeliItemId } from "./items";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("parseMeliItemId", () => {
  it("extracts item identifiers from marketplace links", () => {
    expect(parseMeliItemId("https://articulo.mercadolibre.cl/MLC-123456789"))
      .toBe("MLC123456789");
  });

  it("accepts a raw item identifier and rejects unrelated input", () => {
    expect(parseMeliItemId("MLA123456789")).toBe("MLA123456789");
    expect(parseMeliItemId("https://example.com/product/123")).toBeNull();
  });
});

describe("itemBelongsToCountry", () => {
  it("matches Mercado Libre site identifiers", () => {
    expect(itemBelongsToCountry("MLC123456789", "CL")).toBe(true);
    expect(itemBelongsToCountry("MLA123456789", "CL")).toBe(false);
  });
});

describe("fetchMeliItem", () => {
  it("uses the seller token when one is available", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: "MLA123456789",
      seller_id: 123,
      site_id: "MLA",
      status: "active",
      permalink: "https://articulo.mercadolibre.com.ar/MLA-123456789",
      title: "Publicación activa",
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchMeliItem("MLA123456789", "private-token");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.mercadolibre.com/items/MLA123456789",
      {
        headers: { Authorization: "Bearer private-token" },
        cache: "no-store",
      },
    );
  });
});
