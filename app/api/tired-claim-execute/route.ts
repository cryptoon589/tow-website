import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function requireExecutionAdmin(request: NextRequest) {
  const expected = process.env.TOW_CLAIM_SECRET ?? process.env.TOW_SYNC_SECRET;
  if (!expected) throw new Error("Missing TOW_CLAIM_SECRET or TOW_SYNC_SECRET env var");
  return request.headers.get("x-tow-claim-secret") === expected;
}

export async function POST(request: NextRequest) {
  try {
    if (!requireExecutionAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const claimCode = String(body?.claimCode ?? "").trim().toUpperCase();
    const telegramUsername = String(body?.telegramUsername ?? "").trim().replace(/^@+/, "").toLowerCase();
    if (!claimCode || !telegramUsername) {
      return NextResponse.json({ error: "Missing claim code or Telegram username." }, { status: 400 });
    }
    const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Missing Supabase env vars");
    const supabase = createClient(url, key);
    // One PostgreSQL transaction handles claim, position and archive together.
    // If the migration is missing, fail without partially updating anything.
    const { data, error } = await supabase.rpc("tow_execute_claim_atomic", {
      p_claim_code: claimCode,
      p_telegram_username: telegramUsername,
    });
    if (error) throw error;
    if (!data?.ok) {
      return NextResponse.json({ error: "Claim request expired.", code: data?.code }, { status: 410 });
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({
      error: "Could not execute claim request.",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
