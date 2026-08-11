import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchFirstActiveMeliItemId, MeliOAuthError } from "./oauth";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("MeliOAuthError", () => {
  it("exposes a safe provider code for token failures", () => {
    const error = new MeliOAuthError("token", 400, "invalid_grant");
    expect(error.publicCode).toBe("oauth_invalid_grant");
  });

  it("exposes only the HTTP status for seller lookup failures", () => {
    const error = new MeliOAuthError("seller", 403, "seller_failed");
    expect(error.publicCode).toBe("oauth_seller_403");
  });

  it("exposes only the HTTP status for item search failures", () => {
    const error = new MeliOAuthError("items", 403, "items_failed");
    expect(error.publicCode).toBe("oauth_items_403");
  });
});

describe("fetchFirstActiveMeliItemId", () => {
  it("requests one active item with the seller access token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ results: ["MLA123456789"] }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchFirstActiveMeliItemId(123, "private-token"))
      .resolves.toBe("MLA123456789");

    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://api.mercadolibre.com/users/123/items/search?status=active&limit=1");
    expect(options.headers).toEqual({ Authorization: "Bearer private-token" });
  });

  it("returns null when the seller has no active items", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ results: [] }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )));

    await expect(fetchFirstActiveMeliItemId(123, "private-token")).resolves.toBeNull();
  });
});
