import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  calculateActivityScore,
  calculateMaxRewardTow,
  calculateUnlockedRewardTow,
  getHoldDays,
  getTiredLevel,
  isValidXrplWallet,
} from "@/lib/towProof";

export const dynamic = "force-dynamic";

function getSupabase() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase env vars");
  }

  return createClient(url, key);
}

export async function GET(request: NextRequest) {
  try {
    const wallet = String(request.nextUrl.searchParams.get("wallet") ?? "").trim();

    if (!isValidXrplWallet(wallet)) {
      return NextResponse.json({ error: "Invalid XRPL wallet." }, { status: 400 });
    }

    const supabase = getSupabase();

    const [{ data: positions }, { data: scores }, { data: raids }] = await Promise.all([
      supabase
        .from("tow_buy_positions")
        .select("*")
        .eq("wallet_address", wallet)
        .order("created_at", { ascending: true }),

      supabase
        .from("tow_weekly_scores")
        .select("best_score,runs")
        .eq("wallet_address", wallet),

      supabase.from("raid_posts").select("id").eq("wallet", wallet),
    ]);

    const normalizedPositions =
      positions?.map((position) => {
        const positionHoldDays = getHoldDays(position.created_at);
        const maxRewardTow =
          Number(position.max_reward_tow ?? 0) ||
          calculateMaxRewardTow(Number(position.tow_amount ?? 0));
        const unlockedRewardTow =
          position.status === "alive"
            ? calculateUnlockedRewardTow(maxRewardTow, positionHoldDays)
            : 0;

        return {
          id: position.id,
          walletAddress: position.wallet_address,
          buyTxHash: position.buy_tx_hash,
          buyValueXrp: Number(position.buy_value_xrp ?? 0),
          towAmount: Number(position.tow_amount ?? 0),
          maxRewardTow,
          unlockedRewardTow,
          status: position.status,
          createdAt: position.created_at,
          disqualifiedAt: position.disqualified_at,
          sellTxHash: position.sell_tx_hash,
        };
      }) ?? [];

    const alivePositions = normalizedPositions.filter((position) => position.status === "alive");
    const oldestAlivePosition = alivePositions[0];
    const holdDays = getHoldDays(oldestAlivePosition?.createdAt);

    const totalQualifyingXrp = alivePositions.reduce(
      (sum, position) => sum + position.buyValueXrp,
      0
    );

    const totalTowAmount = alivePositions.reduce(
      (sum, position) => sum + position.towAmount,
      0
    );

    const maxRewardTow = alivePositions.reduce(
      (sum, position) => sum + position.maxRewardTow,
      0
    );

    const unlockedRewardTow = alivePositions.reduce(
      (sum, position) => sum + position.unlockedRewardTow,
      0
    );

    const gameBestScore = Math.max(0, ...(scores?.map((entry) => entry.best_score ?? 0) ?? []));
    const gameRuns = (scores ?? []).reduce((sum, entry) => sum + (entry.runs ?? 0), 0);
    const raidPosts = raids?.length ?? 0;

    const activityScore = calculateActivityScore({
      holdDays,
      gameBestScore,
      gameRuns,
      raidPosts,
      alivePositions: alivePositions.length,
    });

    return NextResponse.json({
      walletAddress: wallet,
      eligible: alivePositions.length > 0,
      disqualified: normalizedPositions.length > 0 && alivePositions.length === 0,
      tiredLevel: getTiredLevel(holdDays),
      holdDays,
      alivePositions: alivePositions.length,
      disqualifiedPositions: normalizedPositions.length - alivePositions.length,
      totalQualifyingXrp,
      totalTowAmount,
      maxRewardTow,
      unlockedRewardTow,
      remainingRewardTow: Math.max(0, maxRewardTow - unlockedRewardTow),
      gameBestScore,
      gameRuns,
      raidPosts,
      activityScore,
      positions: normalizedPositions,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not load tired status.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
