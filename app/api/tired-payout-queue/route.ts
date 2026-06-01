import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

export async function GET(request: NextRequest) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("tow_buy_positions")
      .select("wallet_address,tow_amount,max_reward_tow,unlocked_reward_tow,claimed_at,reward_status")
      .eq("reward_status", "pending_manual_payout")
      .order("claimed_at", { ascending: true });

    if (error) throw error;

    const grouped = new Map<string, any>();

    (data ?? []).forEach((entry) => {
      const wallet = String(entry.wallet_address ?? "").trim();

      if (!grouped.has(wallet)) {
        grouped.set(wallet, {
          walletAddress: wallet,
          claimedAt: entry.claimed_at,
          positions: 0,
          totalTowCommitted: 0,
          totalUnlockedTow: 0,
          rewardStatus: entry.reward_status,
        });
      }

      const row = grouped.get(wallet);

      row.positions += 1;
      row.totalTowCommitted += Number(entry.tow_amount ?? 0);
      row.totalUnlockedTow += Number(entry.unlocked_reward_tow ?? 0);
    });

    return NextResponse.json({
      queue: Array.from(grouped.values()),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not load payout queue.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
