import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { MIN_QUALIFYING_BUY_XRP, calculateMaxRewardTow, isValidXrplWallet } from "@/lib/towProof";

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

export async function POST(request: Request) {
  try {
    if (!requireAdmin(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const body = (await request.json()) as SyncEvent | SyncEvent[];
    const events = Array.isArray(body) ? body : [body];
    const supabase = getSupabase();
    const results = [];

    for (const event of events) {
      const walletAddress = String(event.walletAddress ?? "").trim();
      const txHash = String(event.txHash ?? "").trim();
      const eventType = event.eventType;
      const xrpValue = cleanNumber(event.xrpValue);
      const towAmount = cleanNumber(event.towAmount);
      const eventAt = event.eventAt ? new Date(event.eventAt) : new Date();

      if (!isValidXrplWallet(walletAddress)) {
        results.push({ txHash, ok: false, error: "Invalid wallet." });
        continue;
      }

      if (!txHash) {
        results.push({ walletAddress, ok: false, error: "Missing tx hash." });
        continue;
      }

      if (!eventType) {
        results.push({ walletAddress, txHash, ok: false, error: "Missing event type." });
        continue;
      }

      const { error: eventError } = await supabase.from("tow_wallet_events").upsert(
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
        results.push({ walletAddress, txHash, ok: false, error: eventError.message });
        continue;
      }

      if (eventType === "buy") {
        if (xrpValue >= MIN_QUALIFYING_BUY_XRP && towAmount > 0) {
          const { error: positionError } = await supabase.from("tow_buy_positions").upsert(
            {
              wallet_address: walletAddress,
              buy_tx_hash: txHash,
              buy_value_xrp: xrpValue,
              tow_amount: towAmount,
              max_reward_tow: calculateMaxRewardTow(towAmount),
              status: "alive",
              created_at: eventAt.toISOString(),
            },
            { onConflict: "buy_tx_hash" }
          );

          if (positionError) {
            results.push({ walletAddress, txHash, ok: false, error: positionError.message });
            continue;
          }

          results.push({ walletAddress, txHash, ok: true, action: "position_created" });
        } else {
          results.push({ walletAddress, txHash, ok: true, action: "buy_recorded_not_qualifying" });
        }
        continue;
      }

      if (eventType === "sell") {
        const { data: alivePositions, error: findError } = await supabase
          .from("tow_buy_positions")
          .select("id")
          .eq("wallet_address", walletAddress)
          .eq("status", "alive");

        if (findError) {
          results.push({ walletAddress, txHash, ok: false, error: findError.message });
          continue;
        }

        const { error: disqualifyError } = await supabase
          .from("tow_buy_positions")
          .update({ status: "disqualified", disqualified_at: eventAt.toISOString(), sell_tx_hash: txHash })
          .eq("wallet_address", walletAddress)
          .eq("status", "alive");

        if (disqualifyError) {
          results.push({ walletAddress, txHash, ok: false, error: disqualifyError.message });
          continue;
        }

        results.push({ walletAddress, txHash, ok: true, action: "wallet_disqualified", disqualifiedPositions: alivePositions?.length ?? 0 });
        continue;
      }

      results.push({ walletAddress, txHash, ok: true, action: "event_recorded" });
    }

    return NextResponse.json({ ok: true, results });
  } catch (error) {
    return NextResponse.json({ error: "Could not sync tired events.", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
