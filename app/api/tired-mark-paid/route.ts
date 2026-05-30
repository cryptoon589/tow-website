import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isValidXrplWallet } from "@/lib/towProof";

export const dynamic = "force-dynamic";

function getSupabase() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) throw new Error("Missing Supabase env vars");

  return createClient(url, key);
}

function requireAdmin(request: NextRequest) {
  const expected = process.env.TOW_CLAIM_SECRET ?? process.env.TOW_SYNC_SECRET;

  if (!expected) throw new Error("Missing admin secret env var");

  return request.headers.get("x-tow-claim-secret") === expected;
}

export async function POST(request: NextRequest) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const wallet = String(body?.wallet ?? "").trim();

    if (!isValidXrplWallet(wallet)) {
      return NextResponse.json({ error: "Invalid wallet." }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: pendingRows, error: pendingError } = await supabase
      .from("tow_buy_positions")
      .select("id")
      .eq("wallet_address", wallet)
      .eq("reward_status", "pending_manual_payout");

    if (pendingError) throw pendingError;

    if (!pendingRows || pendingRows.length === 0) {
      return NextResponse.json(
        { error: "No pending payouts found for this wallet." },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("tow_buy_positions")
      .update({
        reward_status: "paid",
        updated_at: now,
      })
      .eq("wallet_address", wallet)
      .eq("reward_status", "pending_manual_payout");

    if (updateError) throw updateError;

    return NextResponse.json({
      ok: true,
      walletAddress: wallet,
      paidCommitments: pendingRows.length,
      rewardStatus: "paid",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not mark payout as paid.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
