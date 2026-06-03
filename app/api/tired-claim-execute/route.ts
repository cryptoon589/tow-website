import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getHoldDays,
  calculateUnlockedRewardTow,
} from "@/lib/towProof";

export const dynamic = "force-dynamic";

function getSupabase() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) throw new Error("Missing Supabase env vars");

  return createClient(url, key);
}

function requireExecutionAdmin(request: NextRequest) {
  const expected = process.env.TOW_CLAIM_SECRET ?? process.env.TOW_SYNC_SECRET;

  if (!expected) throw new Error("Missing TOW_CLAIM_SECRET or TOW_SYNC_SECRET env var");

  return request.headers.get("x-tow-claim-secret") === expected;
}

function getSeasonLabel(days: number) {
  if (days >= 84) return "Season 3 Survivor";
  if (days >= 56) return "Season 2 Survivor";
  return "Season 1 Survivor";
}

export async function POST(request: NextRequest) {
  try {
    if (!requireExecutionAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const claimCode = String(body?.claimCode ?? "").trim().toUpperCase();
    const telegramUsername = String(body?.telegramUsername ?? "")
      .trim()
      .replace(/^@+/, "")
      .toLowerCase();

    if (!claimCode) {
      return NextResponse.json({ error: "Missing claim code." }, { status: 400 });
    }

    if (!telegramUsername) {
      return NextResponse.json({ error: "Missing Telegram username." }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: requestRow, error: requestError } = await supabase
      .from("tow_claim_requests")
      .select("id,wallet_address,x_username,telegram_username,position_id,eligible_position_ids,status,expires_at")
      .eq("claim_code", claimCode)
      .maybeSingle();

    if (requestError) throw requestError;

    if (!requestRow) {
      return NextResponse.json({ error: "Claim request not found." }, { status: 404 });
    }

    if (requestRow.status !== "pending") {
      return NextResponse.json(
        { error: `Claim request is already ${requestRow.status}.` },
        { status: 409 }
      );
    }

    if (new Date(requestRow.expires_at).getTime() <= Date.now()) {
      await supabase
        .from("tow_claim_requests")
        .update({ status: "expired", processed_at: new Date().toISOString() })
        .eq("id", requestRow.id);

      return NextResponse.json({ error: "Claim request expired." }, { status: 410 });
    }

    const linkedTelegram = String(requestRow.telegram_username ?? "").toLowerCase();

    if (linkedTelegram !== telegramUsername) {
      return NextResponse.json(
        { error: "Telegram username does not match this survivor identity." },
        { status: 403 }
      );
    }

    const { data: player, error: playerError } = await supabase
      .from("tow_players")
      .select("verified")
      .eq("wallet_address", requestRow.wallet_address)
      .maybeSingle();

    if (playerError) throw playerError;

    if (!player?.verified) {
      return NextResponse.json(
        { error: "Survivor identity is no longer verified." },
        { status: 403 }
      );
    }

    const positionId = requestRow.position_id;

if (!positionId) {
  return NextResponse.json(
    { error: "Claim request missing commitment position." },
    { status: 400 }
  );
}

    const { data: position, error: positionsError } = await supabase
  .from("tow_buy_positions")
  .select("id,created_at,status,tow_amount,unlocked_reward_tow")
  .eq("wallet_address", requestRow.wallet_address)
  .eq("id", positionId)
  .maybeSingle();

    if (positionsError) throw positionsError;

   if (
  !position ||
  position.status !== "alive" ||
  getHoldDays(position.created_at) < 28
) {
  await supabase
    .from("tow_claim_requests")
    .update({
      status: "rejected",
      processed_at: new Date().toISOString(),
    })
    .eq("id", requestRow.id);

  return NextResponse.json(
    { error: "Commitment is no longer claimable." },
    { status: 400 }
  );
}

    const survivedDays = getHoldDays(position.created_at);

const totalTowCommitted =
  Number(position.tow_amount ?? 0);

const totalUnlockedTow =
  calculateUnlockedRewardTow({
    towAmount: totalTowCommitted,
    holdDays: survivedDays,
  });

    const now = new Date().toISOString();

    const { error: updatePositionsError } = await supabase
      .from("tow_buy_positions")
      .update({
        status: "claimed",
        claimed_at: now,
        reward_status: "pending_manual_payout",
      })
      .eq("id", positionId)
      .eq("status", "alive");

    if (updatePositionsError) throw updatePositionsError;

    const { error: archiveError } = await supabase
      .from("tow_survivor_archives")
      .insert({
        wallet_address: requestRow.wallet_address,
        x_username: requestRow.x_username ?? null,
        telegram_username: requestRow.telegram_username,
        claim_request_id: requestRow.id,
        claim_code: claimCode,
        position_ids: [positionId],
        season_label: getSeasonLabel(survivedDays),
        survived_days: survivedDays,
        total_tow_committed: totalTowCommitted,
        total_unlocked_tow: totalUnlockedTow,
        reward_status: "pending_manual_payout",
        archived_at: now,
      });

    if (archiveError) throw archiveError;

    const { error: updateRequestError } = await supabase
      .from("tow_claim_requests")
      .update({ status: "executed", processed_at: now })
      .eq("id", requestRow.id);

    if (updateRequestError) throw updateRequestError;

    return NextResponse.json({
      ok: true,
      walletAddress: requestRow.wallet_address,
      claimedCommitments: 1,
      survivedDays,
      rewardStatus: "pending_manual_payout",
      seasonLabel: getSeasonLabel(survivedDays),
      message: "Claim executed. Survivor streak archived and reward pending manual payout.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not execute claim request.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
