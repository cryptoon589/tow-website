import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  calculateActivityScore,
  calculateMaxRewardTow,
  calculateUnlockedRewardTow,
  getHoldDays,
  getTiredLevel,
} from "@/lib/towProof";

export const dynamic = "force-dynamic";

type WalletSummary = {
  walletAddress: string;
  holdDays: number;
  alivePositions: number;
  totalTowAmount: number;
  maxRewardTow: number;
  unlockedRewardTow: number;
  gameBestScore: number;
  gameRuns: number;
  raidPosts: number;
  activityScore: number;
};

function getSupabase() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase env vars");
  }

  return createClient(url, key);
}

export async function GET() {
  try {
    const supabase = getSupabase();

    const [{ data: positions }, { data: scores }, { data: raids }] = await Promise.all([
      supabase
        .from("tow_buy_positions")
        .select("wallet_address,tow_amount,max_reward_tow,status,created_at")
        .eq("status", "alive"),

      supabase
        .from("tow_weekly_scores")
        .select("wallet_address,best_score,runs"),

      supabase
        .from("raid_posts")
        .select("wallet"),
    ]);

    const walletMap = new Map<string, WalletSummary>();

    function ensureWallet(walletAddress: string) {
      if (!walletMap.has(walletAddress)) {
        walletMap.set(walletAddress, {
          walletAddress,
          holdDays: 0,
          alivePositions: 0,
          totalTowAmount: 0,
          maxRewardTow: 0,
          unlockedRewardTow: 0,
          gameBestScore: 0,
          gameRuns: 0,
          raidPosts: 0,
          activityScore: 0,
        });
      }

      return walletMap.get(walletAddress)!;
    }

    positions?.forEach((position) => {
      const walletAddress = String(position.wallet_address ?? "").trim();
      if (!walletAddress) return;

      const summary = ensureWallet(walletAddress);
      const holdDays = getHoldDays(position.created_at);
      const towAmount = Number(position.tow_amount ?? 0);
      const maxRewardTow =
        Number(position.max_reward_tow ?? 0) || calculateMaxRewardTow(towAmount);
      const unlockedRewardTow = calculateUnlockedRewardTow(maxRewardTow, holdDays);

      summary.holdDays = summary.holdDays === 0 ? holdDays : Math.min(summary.holdDays, holdDays);
      summary.alivePositions += 1;
      summary.totalTowAmount += towAmount;
      summary.maxRewardTow += maxRewardTow;
      summary.unlockedRewardTow += unlockedRewardTow;
    });

    scores?.forEach((score) => {
      const walletAddress = String(score.wallet_address ?? "").trim();
      if (!walletAddress || !walletMap.has(walletAddress)) return;

      const summary = ensureWallet(walletAddress);
      summary.gameBestScore = Math.max(summary.gameBestScore, Number(score.best_score ?? 0));
      summary.gameRuns += Number(score.runs ?? 0);
    });

    raids?.forEach((raid) => {
      const walletAddress = String(raid.wallet ?? "").trim();
      if (!walletAddress || !walletMap.has(walletAddress)) return;

      const summary = ensureWallet(walletAddress);
      summary.raidPosts += 1;
    });

    const entries = Array.from(walletMap.values())
      .map((summary) => ({
        ...summary,
        remainingRewardTow: Math.max(0, summary.maxRewardTow - summary.unlockedRewardTow),
        tiredLevel: getTiredLevel(summary.holdDays),
        activityScore: calculateActivityScore({
          holdDays: summary.holdDays,
          gameBestScore: summary.gameBestScore,
          gameRuns: summary.gameRuns,
          raidPosts: summary.raidPosts,
          alivePositions: summary.alivePositions,
        }),
      }))
      .sort((a, b) => b.activityScore - a.activityScore)
      .slice(0, 25)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }));

    return NextResponse.json({ entries });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not load tired leaderboard.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
