import { createHmac, timingSafeEqual } from "node:crypto";
import type { CountryCode } from "@/lib/countries";

export const sellerProofCookie = "meli_seller_proof";
export const publicationProofCookie = "meli_publication_proof";
export const verificationProofMaxAge = 60 * 60;

type SellerProof = {
  kind: "seller";
  country: CountryCode;
  campaign: string;
  sellerId: string;
  nickname: string;
  expiresAt: number;
};

type PublicationProof = {
  kind: "publication";
  country: CountryCode;
  campaign: string;
  sellerId: string;
  itemId: string;
  permalink: string;
  title: string;
  expiresAt: number;
};

function signingSecret() {
  const secret = process.env.APP_SIGNING_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("APP_SIGNING_SECRET debe tener al menos 32 caracteres.");
  }
  return secret;
}

export function isVerificationSigningConfigured() {
  return Boolean(process.env.APP_SIGNING_SECRET?.trim().length && process.env.APP_SIGNING_SECRET.trim().length >= 32);
}

function sign(encoded: string) {
  return createHmac("sha256", signingSecret()).update(encoded).digest("base64url");
}

function encodeProof(proof: SellerProof | PublicationProof) {
  const encoded = Buffer.from(JSON.stringify(proof)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

function decodeProof(value: string | undefined) {
  if (!value) return null;
  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) return null;

  const actual = Buffer.from(signature);
  const expected = Buffer.from(sign(encoded));
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  try {
    const proof = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SellerProof | PublicationProof;
    if (!proof.expiresAt || proof.expiresAt <= Date.now()) return null;
    return proof;
  } catch {
    return null;
  }
}

export function createSellerProof(input: Omit<SellerProof, "kind" | "expiresAt">) {
  return encodeProof({
    ...input,
    kind: "seller",
    expiresAt: Date.now() + verificationProofMaxAge * 1000,
  });
}

export function readSellerProof(value: string | undefined) {
  const proof = decodeProof(value);
  return proof?.kind === "seller" ? proof : null;
}

export function createPublicationProof(input: Omit<PublicationProof, "kind" | "expiresAt">) {
  return encodeProof({
    ...input,
    kind: "publication",
    expiresAt: Date.now() + verificationProofMaxAge * 1000,
  });
}

export function readPublicationProof(value: string | undefined) {
  const proof = decodeProof(value);
  return proof?.kind === "publication" ? proof : null;
}
