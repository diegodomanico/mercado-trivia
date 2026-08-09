import { describe, expect, it } from "vitest";
import { itemBelongsToCountry, parseMeliItemId } from "./items";

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
