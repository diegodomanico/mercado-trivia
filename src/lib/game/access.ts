import { createHash, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export function hashGuestToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function verifyGuestToken(expectedHash: string, token: string) {
  const actual = Buffer.from(hashGuestToken(token));
  const expected = Buffer.from(expectedHash);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function canAccessSession(
  request: NextRequest,
  session: { id: string; mode: "practice" | "campaign"; user_id: string | null; guest_token_hash: string | null },
) {
  if (session.mode === "campaign") {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    return Boolean(user && session.user_id === user.id);
  }

  const cookie = request.cookies.get("practice_session")?.value;
  const [sessionId, token] = cookie?.split(".") ?? [];
  return Boolean(
    sessionId === session.id && token && session.guest_token_hash &&
    verifyGuestToken(session.guest_token_hash, token),
  );
}
