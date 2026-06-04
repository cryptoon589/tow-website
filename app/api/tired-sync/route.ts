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

if (eventType === "buy") {
  if (towAmount <= 0 || xrpValue <= 0) {
    results.push({
      walletAddress,
      txHash,
      ok: true,
      action: "buy_recorded_not_counted",
    });
    continue;
  }

  const { data: buyEvents, error: buyEventsError } = await supabase
    .from("tow_wallet_events")
    .select("tx_hash,xrp_value,tow_amount,event_at")
    .eq("wallet_address", walletAddress)
    .eq("event_type", "buy")
    .order("event_at", { ascending: true });

  if (buyEventsError) {
    results.push({
      walletAddress,
      txHash,
      ok: false,
      error: buyEventsError.message,
    });
    continue;
  }

  const cumulativeXrp = (buyEvents ?? []).reduce(
    (sum, buy) => sum + Number(buy.xrp_value ?? 0),
    0
  );

  const cumulativeTow = (buyEvents ?? []).reduce(
    (sum, buy) => sum + Number(buy.tow_amount ?? 0),
    0
  );

  const earnedCommitments = Math.floor(
    cumulativeXrp / MIN_QUALIFYING_BUY_XRP
  );

  const { data: existingCommitments, error: commitmentError } =
    await supabase
      .from("tow_buy_positions")
      .select("id")
      .eq("wallet_address", walletAddress);

  if (commitmentError) {
    results.push({
      walletAddress,
      txHash,
      ok: false,
      error: commitmentError.message,
    });
    continue;
  }

  const existingCount = existingCommitments?.length ?? 0;
  const commitmentsToCreate = earnedCommitments - existingCount;
  const nextThreshold =
  (existingCount + 1) * MIN_QUALIFYING_BUY_XRP;

const neededXrp = Math.max(
  0,
  nextThreshold - cumulativeXrp
);

  if (commitmentsToCreate <= 0) {
    results.push({
      walletAddress,
      txHash,
      ok: true,
      action: "buy_recorded_accumulating",
      cumulativeXrp,
      neededXrp,
    });
    continue;
  }

  const firstBuy = (buyEvents ?? [])[0];
  const commitmentStartAt =
  eventAt.toISOString();
  const commitmentTxHash = firstBuy?.tx_hash ?? txHash;

  const perCommitmentTow =
    earnedCommitments > 0 ? cumulativeTow / earnedCommitments : cumulativeTow;

  const { data: player } = await supabase
    .from("tow_players")
    .select("x_username,telegram_username")
    .eq("wallet_address", walletAddress)
    .maybeSingle();

  for (let i = 0; i < commitmentsToCreate; i++) {
    const commitmentNumber = existingCount + i + 1;

    const { error: positionError } = await supabase
      .from("tow_buy_positions")
      .insert({
        wallet_address: walletAddress,
        buy_tx_hash: `${commitmentTxHash}_${commitmentNumber}`,
        buy_value_xrp: MIN_QUALIFYING_BUY_XRP,
        tow_amount: perCommitmentTow,
        max_reward_tow: calculateMaxRewardTow(perCommitmentTow),
        status: "alive",
        created_at: commitmentStartAt,
      });

    if (positionError) {
      results.push({
        walletAddress,
        txHash,
        ok: false,
        error: positionError.message,
      });
      continue;
    }

    positionsCreated++;

    newCommitments.push({
      walletAddress,
      xUsername: player?.x_username ?? null,
      telegramUsername: player?.telegram_username ?? null,
      xrpAmount: MIN_QUALIFYING_BUY_XRP,
      towAmount: perCommitmentTow,
      txHash: `${commitmentTxHash}_${commitmentNumber}`,
    });
  }

  results.push({
    walletAddress,
    txHash,
    ok: true,
    action: "cumulative_positions_checked",
    cumulativeXrp,
    cumulativeTow,
    earnedCommitments,
    existingCount,
    createdCommitments: commitmentsToCreate,
  });

  continue;
}

      if (eventType === "sell") {
        const { data: alivePositions, error: findError } = await supabase
          .from("tow_buy_positions")
          .select("id,created_at")
          .order("created_at", { ascending: true })
          .eq("wallet_address", walletAddress)
          .eq("status", "alive");

        if (findError) {
          results.push({
            walletAddress,
            txHash,
            ok: false,
            error: findError.message,
          });
          continue;
        }

        const { error: disqualifyError } = await supabase
          .from("tow_buy_positions")
          .update({
            status: "disqualified",
            disqualified_at: eventAt.toISOString(),
            sell_tx_hash: txHash,
          })
          .eq("wallet_address", walletAddress)
          .eq("status", "alive");

        if (disqualifyError) {
          results.push({
            walletAddress,
            txHash,
            ok: false,
            error: disqualifyError.message,
          });
          continue;
        }

        const disqualifiedCount =
  alivePositions?.length ?? 0;

if (disqualifiedCount > 0) {
  disqualified += disqualifiedCount;

  const { data: player } = await supabase
    .from("tow_players")
    .select("x_username,telegram_username")
    .eq("wallet_address", walletAddress)
    .maybeSingle();

  const oldestPosition =
  alivePositions?.[0];

const holdDays = oldestPosition?.created_at
  ? Math.floor(
      (Date.now() -
        new Date(
          oldestPosition.created_at
        ).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  : 0;

  disqualifiedCommitments.push({
    holdDays,
    walletAddress,
    xUsername: player?.x_username ?? null,
    telegramUsername:
      player?.telegram_username ?? null,
    txHash,
    count: disqualifiedCount,
  });
}

results.push({
  walletAddress,
  txHash,
  ok: true,
  action: "wallet_disqualified",
  disqualifiedPositions: disqualifiedCount,
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
