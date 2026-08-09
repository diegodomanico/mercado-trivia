import { afterEach, describe, expect, it, vi } from "vitest";
import { createSellerProof, readSellerProof } from "@/lib/mercadolibre/verification";

afterEach(() => vi.unstubAllEnvs());

describe("Mercado Libre verification proofs", () => {
  it("round-trips a valid signed seller proof", () => {
    vi.stubEnv("APP_SIGNING_SECRET", "test-secret-with-at-least-32-characters");
    const value = createSellerProof({
      country: "CL",
      campaign: "melixp-chile-2026",
      sellerId: "12345",
      nickname: "VENDEDOR",
    });

    expect(readSellerProof(value)).toMatchObject({ sellerId: "12345", country: "CL" });
  });

  it("rejects a tampered proof", () => {
    vi.stubEnv("APP_SIGNING_SECRET", "test-secret-with-at-least-32-characters");
    const value = createSellerProof({
      country: "AR",
      campaign: "melixp-argentina-2026",
      sellerId: "98765",
      nickname: "SELLER",
    });

    expect(readSellerProof(`${value}x`)).toBeNull();
  });
});
