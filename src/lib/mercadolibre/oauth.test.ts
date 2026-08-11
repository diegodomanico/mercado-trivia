import { describe, expect, it } from "vitest";
import { MeliOAuthError } from "./oauth";

describe("MeliOAuthError", () => {
  it("exposes a safe provider code for token failures", () => {
    const error = new MeliOAuthError("token", 400, "invalid_grant");
    expect(error.publicCode).toBe("oauth_invalid_grant");
  });

  it("exposes only the HTTP status for seller lookup failures", () => {
    const error = new MeliOAuthError("seller", 403, "seller_failed");
    expect(error.publicCode).toBe("oauth_seller_403");
  });
});
