import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const checks = {
    supabase: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
    mercadoLibreArgentina: Boolean(
      process.env.MELI_AR_CLIENT_ID && process.env.MELI_AR_CLIENT_SECRET,
    ),
    mercadoLibreChile: Boolean(
      process.env.MELI_CL_CLIENT_ID && process.env.MELI_CL_CLIENT_SECRET,
    ),
  };

  const ready = Object.values(checks).every(Boolean);
  return NextResponse.json(
    { status: ready ? "ready" : "configuration_required", checks },
    { status: ready ? 200 : 503 },
  );
}
