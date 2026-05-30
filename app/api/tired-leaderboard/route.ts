import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  calculateMaxRewardTow,
  calculateSurvivalScore,
  calculateUnlockedRewardTow,
  getHoldDays,
  getTiredLevel,
} from "@/lib/towProof";

export const dynamic = "force-dynamic";

type WalletSummary = {
  walletAddress: string;
  xUsername: string | null;
  verified: boolean;
  holdDays: number;
  alivePositions: number;
  totalTowAmount: number;
  maxRewardTow: number;
  unlockedRewardTow: number;
  gameBestScore: number;
  gameRuns: number;
  raidPosts: number;
  survivalScore: number;
};

function getSupabase() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key);
}

export async function GET() {
  try {
    const supabase = getSupabase();

    const [{ data: positions }, { data: scores }, { data: raids }, { data: players }] =
      await Promise.all([
        supabase
          .from("tow_buy_positions")
          .select(
            "wallet_address,tow_amount,max_reward_tow,status,created_at"
          )
          .eq("status", "alive"),

        supabase
          .from("tow_weekly_scores")
          .select("wallet_address,x_username,best_score,runs"),

        supabase.from("raid_posts").select("wallet"),

        supabase
          .from("tow_players")
          .select("wallet_address,verified,x_username"),
      ]);

    const verifiedWallets = new Map<
      string,
      { verified: boolean; xUsername: string | null }
    >();

    players?.forEach((player) => {
      const walletAddress = String(player.wallet_address ?? "").trim();

      if (!walletAddress) return;

      verifiedWallets.set(walletAddress, {
        verified: Boolean(player.verified),
        xUsername: player.x_username ?? null,
      });
    });

    const walletMap = new Map<string, WalletSummary>();

    function ensureWallet(walletAddress: string) {
      if (!walletMap.has(walletAddress)) {
        const player = verifiedWallets.get(walletAddress);

        walletMap.set(walletAddress, {
          walletAddress,
          xUsername: player?.xUsername ?? null,
          verified: Boolean(player?.verified),
          holdDays: 0,
          alivePositions: 0,
          totalTowAmount: 0,
          maxRewardTow: 0,
          unlockedRewardTow: 0,
          gameBestScore: 0,
          gameRuns: 0,
          raidPosts: 0,
          survivalScore: 0,
        });
      }

      return walletMap.get(walletAddress)!;
    }

    positions?.forEach((position) => {
      const walletAddress = String(position.wallet_address ?? "").trim();

      if (!walletAddress) return;

      const summary = ensureWallet(walletAddress);

      // Public leaderboard only includes verified survivor identities.
      if (!summary.verified) return;

      const holdDays = getHoldDays(position.created_at);
      const towAmount = Number(position.tow_amount ?? 0);

      const maxRewardTow =
        Number(position.max_reward_tow ?? 0) ||
        calculateMaxRewardTow(towAmount);

      const unlockedRewardTow = calculateUnlockedRewardTow({
        towAmount,
        rewardPercent:
          holdDays >= 84
            ? 15
            : holdDays >= 56
            ? 7
            : holdDays >= 28
            ? 2.5
            : 0,
      });

      // Use the OLDEST active commitment as the wallet's real survivor streak.
      summary.holdDays = Math.max(summary.holdDays, holdDays);

      summary.alivePositions += 1;
      summary.totalTowAmount += towAmount;
      summary.maxRewardTow += maxRewardTow;
      summary.unlockedRewardTow += unlockedRewardTow;
    });

    scores?.forEach((score) => {
      const walletAddress = String(score.wallet_address ?? "").trim();

      if (!walletAddress || !walletMap.has(walletAddress)) return;

      const summary = ensureWallet(walletAddress);

      if (!summary.verified) return;

      summary.xUsername = summary.xUsername ?? score.x_username ?? null;

      summary.gameBestScore = Math.max(
        summary.gameBestScore,
        Number(score.best_score ?? 0)
      );

      summary.gameRuns += Number(score.runs ?? 0);
    });

    raids?.forEach((raid) => {
      const walletAddress = String(raid.wallet ?? "").trim();

      if (!walletAddress || !walletMap.has(walletAddress)) return;

      const summary = ensureWallet(walletAddress);

      if (!summary.verified) return;

      summary.raidPosts += 1;
    });

    const entries = Array.from(walletMap.values())
      .filter((summary) => summary.verified)
      .filter((summary) => summary.alivePositions > 0)
      .map((summary) => {
        const survivalScore = calculateSurvivalScore({
          holdDays: summary.holdDays,
          gameBestScore: summary.gameBestScore,
          gameRuns: summary.gameRuns,
          raidPosts: summary.raidPosts,
          alivePositions: summary.alivePositions,
          totalTowAmount: summary.totalTowAmount,
        });

        return {
          ...summary,
          survivalScore,
          activityScore: survivalScore,
          remainingRewardTow: Math.max(
            0,
            summary.maxRewardTow - summary.unlockedRewardTow
          ),
          tiredLevel: getTiredLevel(summary.holdDays),
        };
      })
      .sort((a, b) => b.survivalScore - a.survivalScore)
      .slice(0, 25)
      .map((entry, index) => ({ rank: index + 1, ...entry }));

    return NextResponse.json({ entries });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not load tired leaderboard.",
        details:
          error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
