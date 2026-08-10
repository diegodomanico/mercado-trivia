import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSafeSupabaseErrorCode } from "@/lib/supabase/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = {
    url: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    publishableKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    secretKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    database: false,
    errorCode: null as string | null,
  };

  if (supabase.url && supabase.secretKey) {
    try {
      const { error } = await createSupabaseAdminClient()
        .from("campaigns")
        .select("id")
        .limit(1);
      supabase.database = !error;
      supabase.errorCode = error ? getSafeSupabaseErrorCode(error) : null;
      if (error) console.error("Supabase health check failed", error);
    } catch (error) {
      supabase.errorCode = getSafeSupabaseErrorCode(error);
      console.error("Supabase health check failed", error);
    }
  }
  const mercadoLibre = {
    clientId: Boolean(process.env.MELI_CLIENT_ID),
    clientSecret: Boolean(process.env.MELI_CLIENT_SECRET),
    redirectBaseUrl: Boolean(process.env.MELI_OAUTH_REDIRECT_BASE_URL),
    pkce: process.env.MELI_USE_PKCE === "true",
  };
  const checks = {
    supabase: supabase.url && supabase.publishableKey && supabase.secretKey && supabase.database,
    mercadoLibre: mercadoLibre.clientId && mercadoLibre.clientSecret && mercadoLibre.redirectBaseUrl,
  };

  const ready = Object.values(checks).every(Boolean);
  return NextResponse.json(
    {
      status: ready ? "ready" : "configuration_required",
      checks,
      details: { supabase, mercadoLibre },
    },
    { status: ready ? 200 : 503 },
  );
}
