import { describe, expect, it } from "vitest";
import { getSafeSupabaseErrorCode } from "./errors";

describe("getSafeSupabaseErrorCode", () => {
  it("preserves a PostgREST error code", () => {
    expect(getSafeSupabaseErrorCode({ code: "PGRST301", message: "ignored" })).toBe("PGRST301");
  });

  it("classifies API key failures without exposing their message", () => {
    expect(getSafeSupabaseErrorCode({ message: "Invalid API key" })).toBe("INVALID_API_KEY");
  });

  it("classifies connection failures", () => {
    expect(getSafeSupabaseErrorCode({ message: "TypeError: fetch failed" })).toBe("NETWORK_ERROR");
  });

  it("uses a generic code for unknown errors", () => {
    expect(getSafeSupabaseErrorCode(new Error("unexpected details"))).toBe("SUPABASE_QUERY_FAILED");
  });
});
