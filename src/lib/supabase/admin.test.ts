import { describe, expect, it } from "vitest";
import { hasValidSupabaseSecretKeyFormat } from "./admin";

describe("hasValidSupabaseSecretKeyFormat", () => {
  it("accepts modern secret keys and surrounding whitespace", () => {
    expect(hasValidSupabaseSecretKeyFormat("  sb_secret_abcdefghijklmnopqrstuvwxyz  ")).toBe(true);
  });

  it("accepts legacy service-role JWTs", () => {
    expect(hasValidSupabaseSecretKeyFormat("eyJheader.payload.signature")).toBe(true);
  });

  it("rejects masked or truncated values", () => {
    expect(hasValidSupabaseSecretKeyFormat("sb_secret_YK2o3••••••••••" )).toBe(false);
    expect(hasValidSupabaseSecretKeyFormat("sb_secret_short")).toBe(false);
  });
});
