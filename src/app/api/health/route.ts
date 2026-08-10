import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const supabase = {
    url: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    publishableKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    secretKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };
  const mercadoLibre = {
    clientId: Boolean(process.env.MELI_CLIENT_ID),
    clientSecret: Boolean(process.env.MELI_CLIENT_SECRET),
    redirectBaseUrl: Boolean(process.env.MELI_OAUTH_REDIRECT_BASE_URL),
    pkce: process.env.MELI_USE_PKCE === "true",
  };
  const checks = {
    supabase: Object.values(supabase).every(Boolean),
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
