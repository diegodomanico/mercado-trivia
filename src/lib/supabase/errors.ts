type SupabaseErrorLike = {
  code?: unknown;
  message?: unknown;
};

export function getSafeSupabaseErrorCode(error: unknown): string {
  if (!error || typeof error !== "object") return "SUPABASE_QUERY_FAILED";

  const { code, message } = error as SupabaseErrorLike;
  if (typeof code === "string" && code) return code;
  if (typeof message !== "string") return "SUPABASE_QUERY_FAILED";

  if (/invalid api key/i.test(message)) return "INVALID_API_KEY";
  if (/no api key|missing api key/i.test(message)) return "MISSING_API_KEY";
  if (/fetch failed|failed to fetch|network/i.test(message)) return "NETWORK_ERROR";
  if (/schema cache|relation .* does not exist/i.test(message)) return "SCHEMA_UNAVAILABLE";
  if (/permission denied|row-level security/i.test(message)) return "DATABASE_PERMISSION_DENIED";

  return "SUPABASE_QUERY_FAILED";
}
