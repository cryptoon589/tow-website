import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  MIN_QUALIFYING_BUY_XRP,
  calculateMaxRewardTow,
  isValidXrplWallet,
} from "@/lib/towProof";

export const dynamic = "force-dynamic";

type SyncEvent = {
  walletAddress?: string;
  txHash?: string;
  eventType?: "buy" | "sell" | "transfer_in" | "transfer_out" | "reward";
  xrpValue?: number;
  towAmount?: number;
  counterparty?: string;
  ledgerIndex?: number;
  eventAt?: string;
  rawEvent?: unknown;
};

const VALID_EVENT_TYPES = new Set([
  "buy",
  "sell",
  "transfer_in",
  "transfer_out",
  "reward",
]);

const MIN_REAL_SELL_XRP = 5;
const MIN_REAL_SELL_TOW = 1000;

function getSupabase() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) throw new Error("Missing Supabase env vars");

  return createClient(url, key);
}

function requireAdmin(request: Request) {
  const expected = process.env.TOW_SYNC_SECRET;

  if (!expected) throw new Error("Missing TOW_SYNC_SECRET env var");

  return request.headers.get("x-tow-sync-secret") === expected;
}

function cleanNumber(value: unknown) {
  const numberValue = Number(value ?? 0);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function cleanEventDate(value?: string) {
  if (!value) return new Date();

  const parsed = new Date(value);

  return Number.isFinite(parsed.getTime()) ? parsed : new Date();
}

export async function POST(request: Request) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as SyncEvent | SyncEvent[];
    const events = Array.isArray(body) ? body : [body];
    const supabase = getSupabase();
    const results = [];

    let positionsCreated = 0;
    let disqualified = 0;

    const newCommitments = [];
    const disqualifiedCommitments = [];

    for (const event of events) {
      const walletAddress = String(event.walletAddress ?? "").trim();
      const txHash = String(event.txHash ?? "").trim();
      const eventType = String(event.eventType ?? "").trim();
      const xrpValue = cleanNumber(event.xrpValue);
      const towAmount = cleanNumber(event.towAmount);
      const eventAt = cleanEventDate(event.eventAt);

      if (!isValidXrplWallet(walletAddress)) {
        results.push({ txHash, ok: false, error: "Invalid wallet." });
        continue;
      }

      if (!txHash) {
        results.push({ walletAddress, ok: false, error: "Missing tx hash." });
        continue;
      }

      if (!VALID_EVENT_TYPES.has(eventType)) {
        results.push({
          walletAddress,
          txHash,
          ok: false,
          error: "Invalid or missing event type.",
        });
        continue;
      }

      const { error: eventError } = await supabase
        .from("tow_wallet_events")
        .upsert(
          {
            wallet_address: walletAddress,
            tx_hash: txHash,
            event_type: eventType,
            xrp_value: xrpValue,
            tow_amount: towAmount,
            counterparty: event.counterparty ?? null,
            ledger_index: event.ledgerIndex ?? null,
            event_at: eventAt.toISOString(),
            raw_event: event.rawEvent ?? event,
          },
          { onConflict: "tx_hash" }
        );

      if (eventError) {
        results.push({
          walletAddress,
          txHash,
          ok: false,
          error: eventError.message,
        });
        continue;
      }

if (eventType === "buy" || eventType === "sell") {
  if (
    eventType === "sell" &&
    (xrpValue < MIN_REAL_SELL_XRP || towAmount < MIN_REAL_SELL_TOW)
  ) {
    results.push({
      walletAddress,
      txHash,
      ok: true,
      action: "sell_ignored_dust_or_amm_noise",
      xrpValue,
      towAmount,
    });
    continue;
  }

  const { data: buyEvents, error: buyEventsError } = await supabase
    .from("tow_wallet_events")
    .select("tx_hash,xrp_value,tow_amount,event_at")
    .eq("wallet_address", walletAddress)
    .eq("event_type", "buy");

  if (buyEventsError) {
    results.push({ walletAddress, txHash, ok: false, error: buyEventsError.message });
    continue;
  }

  const { data: sellEvents, error: sellEventsError } = await supabase
    .from("tow_wallet_events")
    .select("tx_hash,xrp_value,tow_amount,event_at")
    .eq("wallet_address", walletAddress)
    .eq("event_type", "sell")
    .gte("xrp_value", MIN_REAL_SELL_XRP)
    .gte("tow_amount", MIN_REAL_SELL_TOW);

  if (sellEventsError) {
    results.push({ walletAddress, txHash, ok: false, error: sellEventsError.message });
    continue;
  }

  const totalBuyXrp = (buyEvents ?? []).reduce(
    (sum, buy) => sum + Number(buy.xrp_value ?? 0),
    0
  );

  const totalBuyTow = (buyEvents ?? []).reduce(
    (sum, buy) => sum + Number(buy.tow_amount ?? 0),
    0
  );

  const totalSellXrp = (sellEvents ?? []).reduce(
    (sum, sell) => sum + Number(sell.xrp_value ?? 0),
    0
  );

  const totalSellTow = (sellEvents ?? []).reduce(
  (sum, sell) => sum + Number(sell.tow_amount ?? 0),
  0
);

const netCommittedTow = Math.max(0, totalBuyTow - totalSellTow);

  const netCommittedXrp = Math.max(0, totalBuyXrp - totalSellXrp);

  const targetCommitments = Math.floor(
    netCommittedXrp / MIN_QUALIFYING_BUY_XRP
  );

  const { data: existingCommitments, error: commitmentError } = await supabase
    .from("tow_buy_positions")
    .select("id,created_at,status")
    .eq("wallet_address", walletAddress)
    .eq("status", "alive")
    .order("created_at", { ascending: true });

  if (commitmentError) {
    results.push({ walletAddress, txHash, ok: false, error: commitmentError.message });
    continue;
  }

  const existingCount = existingCommitments?.length ?? 0;
  const delta = targetCommitments - existingCount;

  const { data: player } = await supabase
    .from("tow_players")
    .select("x_username,telegram_username,proof_started_at")
    .eq("wallet_address", walletAddress)
    .maybeSingle();

  const proofStartedAt = player?.proof_started_at
    ? new Date(player.proof_started_at)
    : null;

  const isHistoricalEvent = proofStartedAt ? eventAt < proofStartedAt : true;

  const perCommitmentTow =
  targetCommitments > 0 ? netCommittedTow / targetCommitments : 0;

  if (delta > 0) {
    for (let i = 0; i < delta; i++) {
      const commitmentNumber = existingCount + i + 1;

      const { error: insertError } = await supabase
        .from("tow_buy_positions")
        .insert({
          wallet_address: walletAddress,
          buy_tx_hash: `${txHash}_${commitmentNumber}`,
          buy_value_xrp: MIN_QUALIFYING_BUY_XRP,
          tow_amount: perCommitmentTow,
          max_reward_tow: calculateMaxRewardTow(perCommitmentTow),
          status: "alive",
          created_at: eventAt.toISOString(),
        });

      if (insertError) {
        results.push({ walletAddress, txHash, ok: false, error: insertError.message });
        continue;
      }

      positionsCreated++;

      if (!isHistoricalEvent) {
        newCommitments.push({
          walletAddress,
          xUsername: player?.x_username ?? null,
          telegramUsername: player?.telegram_username ?? null,
          xrpAmount: MIN_QUALIFYING_BUY_XRP,
          towAmount: perCommitmentTow,
          txHash: `${txHash}_${commitmentNumber}`,
        });
      }
    }
  }

  if (delta < 0) {
    const commitmentsToRemove = Math.abs(delta);
    const removable = (existingCommitments ?? []).slice(0, commitmentsToRemove);

    for (const position of removable) {
      const { error: removeError } = await supabase
        .from("tow_buy_positions")
        .update({
          status: "disqualified",
          disqualified_at: eventAt.toISOString(),
          sell_tx_hash: txHash,
        })
        .eq("id", position.id);

      if (removeError) {
        results.push({ walletAddress, txHash, ok: false, error: removeError.message });
        continue;
      }

      disqualified++;

      if (!isHistoricalEvent) {
        const holdDays = position.created_at
          ? Math.floor(
              (Date.now() - new Date(position.created_at).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0;

        disqualifiedCommitments.push({
          holdDays,
          walletAddress,
          xUsername: player?.x_username ?? null,
          telegramUsername: player?.telegram_username ?? null,
          txHash,
          count: 1,
        });
      }
    }
  }

  const nextThreshold = (targetCommitments + 1) * MIN_QUALIFYING_BUY_XRP;
  const neededXrp = Math.max(0, nextThreshold - netCommittedXrp);

  results.push({
    walletAddress,
    txHash,
    ok: true,
    action: "net_commitments_reconciled",
    totalBuyXrp,
    totalSellXrp,
    netCommittedXrp,
    targetCommitments,
    existingCount,
    delta,
    neededXrp,
    totalSellTow,
    netCommittedTow,
    totalBuyTow,
  });

  continue;
}

      results.push({
        walletAddress,
        txHash,
        ok: true,
        action: "event_recorded",
      });
    }

   return NextResponse.json({
  ok: true,
  positionsCreated,
  disqualified,
  newCommitments,
  disqualifiedCommitments,
  results,
});
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not sync wallet events.",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}
