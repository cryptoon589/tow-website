import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  RECENT_ACTIVITY_WINDOW_DAYS,
  calculateMaxRewardTow,
  calculateRewardBreakdown,
  calculateSurvivalScore,
  calculateUnlockedRewardTow,
  getHoldDays,
  getTiredLevel,
  isValidXrplWallet,
} from "@/lib/towProof";

export const dynamic = "force-dynamic";

function getSupabase() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key);
}

function isRecent(value?: string | null) {
  if (!value) return false;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return false;
  return Date.now() - timestamp <= RECENT_ACTIVITY_WINDOW_DAYS * 86400000;
}

export async function GET(request: NextRequest) {
  try {
    const wallet = String(request.nextUrl.searchParams.get("wallet") ?? "").trim();

    if (!isValidXrplWallet(wallet)) {
      return NextResponse.json(
        { error: "Invalid XRPL wallet." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const [
      { data: player },
      { data: positions },
      { data: scores },
      { data: raids },
      { data: archives },
    ] = await Promise.all([
      supabase
        .from("tow_players")
        .select("x_username,telegram_username,verified")
        .eq("wallet_address", wallet)
        .maybeSingle(),

      supabase
        .from("tow_buy_positions")
        .select("*")
        .eq("wallet_address", wallet)
        .order("created_at", { ascending: true }),

      supabase
        .from("tow_weekly_scores")
        .select("best_score,runs,updated_at")
        .eq("wallet_address", wallet),

      supabase
        .from("raid_posts")
        .select("id,created_at")
        .eq("wallet", wallet),

      supabase
        .from("tow_survivor_archives")
        .select(
          "season_label,survived_days,total_tow_committed,total_unlocked_tow,reward_status,archived_at,paid_at"
        )
        .eq("wallet_address", wallet)
        .order("archived_at", { ascending: false }),
    ]);

    const verified = Boolean(player?.verified);

    const raidPosts = raids?.length ?? 0;

    const recentRaidPosts =
      raids?.filter((raid) => isRecent(raid.created_at)).length ?? 0;

    const gameBestScore = Math.max(
      0,
      ...(scores?.map((entry) => entry.best_score ?? 0) ?? [])
    );

    const gameRuns = (scores ?? []).reduce(
      (sum, entry) => sum + (entry.runs ?? 0),
      0
    );

    const recentGameRuns = (scores ?? [])
      .filter((entry) => isRecent(entry.updated_at))
      .reduce((sum, entry) => sum + (entry.runs ?? 0), 0);

    const normalizedPositions =
      positions?.map((position) => {
        const positionHoldDays = getHoldDays(position.created_at);
        const towAmount = Number(position.tow_amount ?? 0);
        const positionTiredLevel =
          getTiredLevel(positionHoldDays);

        const rewardBreakdown = calculateRewardBreakdown({
          holdDays: positionHoldDays,
          recentGameRuns,
          recentRaidPosts,
          gameRuns,
          raidPosts,
          gameBestScore,
        });

        const maxRewardTow = calculateMaxRewardTow(towAmount);

        const unlockedRewardTow =
          position.status === "alive"
            ? calculateUnlockedRewardTow({
                towAmount,
                rewardPercent: rewardBreakdown.totalPercent,
              })
            : 0;

        return {
          id: position.id,
          holdDays: positionHoldDays,
          tiredLevel: positionTiredLevel,
          walletAddress: position.wallet_address,
          buyTxHash: position.buy_tx_hash,
          buyValueXrp: Number(position.buy_value_xrp ?? 0),
          towAmount,
          maxRewardTow,
          unlockedRewardTow,
          status: position.status,
          rewardStatus: position.reward_status,
          createdAt: position.created_at,
          claimedAt: position.claimed_at,
          disqualifiedAt: position.disqualified_at,
          sellTxHash: position.sell_tx_hash,
        };
      }) ?? [];

    const alivePositions = normalizedPositions.filter(
      (position) => position.status === "alive"
    );

    const activeCommitments =
  alivePositions.map((position) => ({
    id: position.id,
    holdDays: position.holdDays,
    tiredLevel: position.tiredLevel,
    towAmount: position.towAmount,
    buyValueXrp: position.buyValueXrp,
    unlockedRewardTow:
      position.unlockedRewardTow,
    maxRewardTow:
      position.maxRewardTow,
    createdAt: position.createdAt,
  }));

    const oldestAlivePosition = alivePositions[0];

    const stillHereSince = oldestAlivePosition?.createdAt ?? null;

    const holdDays = getHoldDays(stillHereSince);

    const totalQualifyingXrp = alivePositions.reduce(
      (sum, position) => sum + position.buyValueXrp,
      0
    );

    const totalTowAmount = alivePositions.reduce(
      (sum, position) => sum + position.towAmount,
      0
    );

    const rewardBreakdown = calculateRewardBreakdown({
      holdDays,
      recentGameRuns,
      recentRaidPosts,
      gameRuns,
      raidPosts,
      gameBestScore,
    });

    const maxRewardTow = calculateMaxRewardTow(totalTowAmount);

    const unlockedRewardTow = calculateUnlockedRewardTow({
      towAmount: totalTowAmount,
      rewardPercent: rewardBreakdown.totalPercent,
    });

    const survivalScore = verified
      ? calculateSurvivalScore({
          holdDays,
          gameBestScore,
          gameRuns,
          raidPosts,
          alivePositions: alivePositions.length,
          totalTowAmount,
        })
      : 0;

    return NextResponse.json({
      walletAddress: wallet,
      verified,
      xUsername: player?.x_username ?? null,
      eligible: verified && alivePositions.length > 0,
      disqualified:
        normalizedPositions.length > 0 && alivePositions.length === 0,
      tiredLevel: getTiredLevel(holdDays),
      holdDays,
      stillHereSince,
      alivePositions: alivePositions.length,
      disqualifiedPositions:
        normalizedPositions.length - alivePositions.length,
      totalQualifyingXrp,
      totalTowAmount,
      maxRewardTow,
      unlockedRewardTow,
      remainingRewardTow: Math.max(
        0,
        maxRewardTow - unlockedRewardTow
      ),
      rewardBreakdown,
      gameBestScore,
      gameRuns,
      recentGameRuns,
      raidPosts,
      recentRaidPosts,
      survivalScore,
      activityScore: survivalScore,
      positions: normalizedPositions,
      activeCommitments,
      archives: archives ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not load tired status.",
        details:
          error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
