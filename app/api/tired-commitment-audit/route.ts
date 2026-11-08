import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isValidXrplWallet, MIN_QUALIFYING_BUY_XRP } from "@/lib/towProof";
import { reconcileCostBasis, type LedgerMovement } from "@/lib/towCostBasis";
import { replayProofCommitments, type ProofMovement } from "@/lib/towCommitmentLifecycle";
import { reconstructProofBaseline } from "@/lib/towProofBaseline";
import { assessProofMigration } from "@/lib/towMigrationReadiness";

export const dynamic = "force-dynamic";

function xrplTime(raw: any): string | null {
  const tx = raw?.tx ?? raw?.tx_json ?? raw;
  const seconds = Number(tx?.date);
  if (!Number.isFinite(seconds) || seconds < 0 || tx?.date == null) return null;
  const date = new Date((seconds + 946684800) * 1000);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

export async function GET(request: NextRequest) {
  try {
    const secret = process.env.TOW_SYNC_SECRET;
    if (!secret || request.headers.get("x-tow-sync-secret") !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const wallet = String(request.nextUrl.searchParams.get("wallet") ?? "").trim();
    if (!isValidXrplWallet(wallet)) {
      return NextResponse.json({ error: "Invalid wallet" }, { status: 400 });
    }
    const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Missing Supabase configuration");
    const db = createClient(url, key);
    const [playerResult, eventsResult, positionsResult] = await Promise.all([
      db.from("tow_players").select("verified,proof_started_at,last_scanned_ledger").eq("wallet_address", wallet).maybeSingle(),
      db.from("tow_wallet_events").select("tx_hash,event_type,xrp_value,tow_amount,ledger_index,event_at,raw_event").eq("wallet_address", wallet).order("ledger_index", { ascending: true }).limit(1000),
      db.from("tow_buy_positions").select("id,buy_tx_hash,buy_value_xrp,tow_amount,remaining_tow,status,created_at,disqualified_at,sell_tx_hash,reward_status,claimed_at,reward_sent_at,reward_tx_hash,unlocked_reward_tow").eq("wallet_address", wallet).order("created_at", { ascending: true }).limit(1000),
    ]);
    if (playerResult.error) throw playerResult.error;
    if (eventsResult.error) throw eventsResult.error;
    if (positionsResult.error) throw positionsResult.error;
    const proofStartedAt = playerResult.data?.proof_started_at ?? null;
    const events = (eventsResult.data ?? []).map((event) => {
      const actualTime = xrplTime(event.raw_event);
      const timestampMismatchSeconds = actualTime
        ? Math.round((new Date(event.event_at).getTime() - new Date(actualTime).getTime()) / 1000)
        : null;
      return {
        txHash: event.tx_hash,
        type: event.event_type,
        ledgerIndex: event.ledger_index,
        recordedTime: event.event_at,
        xrplTime: actualTime,
        timestampMismatchSeconds,
        relativeToProof: !actualTime || !proofStartedAt ? "unknown" :
          new Date(actualTime) < new Date(proofStartedAt) ? "before" : "after",
        xrpValue: Number(event.xrp_value),
        towAmount: Number(event.tow_amount),
      };
    });
    const positions = (positionsResult.data ?? []).map((position) => ({
      ...position,
      buy_value_xrp: Number(position.buy_value_xrp),
      tow_amount: Number(position.tow_amount),
      remaining_tow: position.remaining_tow == null ? null : Number(position.remaining_tow),
    }));
    const movements: LedgerMovement[] = (eventsResult.data ?? []).map((event) => ({
      txHash: String(event.tx_hash),
      ledgerIndex: Number(event.ledger_index),
      transactionIndex: Number((event.raw_event as any)?.meta?.TransactionIndex ?? 0),
      eventAt: xrplTime(event.raw_event),
      type: event.event_type as LedgerMovement["type"],
      xrpValue: Number(event.xrp_value),
      towAmount: Number(event.tow_amount),
    }));
    const costBasis = reconcileCostBasis(movements, MIN_QUALIFYING_BUY_XRP);
    const lifecycle = replayProofCommitments(
      movements.map((movement): ProofMovement => ({
        ...movement,
        eventAt: movement.eventAt ?? "",
        transactionIndex: movement.transactionIndex ?? undefined,
      })),
      MIN_QUALIFYING_BUY_XRP,
      proofStartedAt
    );
    const baseline = proofStartedAt
      ? reconstructProofBaseline(
          movements.map((movement): ProofMovement => ({
            ...movement,
            eventAt: movement.eventAt ?? "",
            transactionIndex: movement.transactionIndex ?? undefined,
          })),
          proofStartedAt,
          MIN_QUALIFYING_BUY_XRP
        )
      : null;
    const warnings: string[] = [
      ...costBasis.warnings,
      ...lifecycle.warnings,
      ...(baseline?.warnings ?? []),
    ];
    if (events.length === 1000) warnings.push("Event query hit 1000 rows: audit may be incomplete.");
    if (positions.length === 1000) warnings.push("Position query hit 1000 rows: audit may be incomplete.");
    if (events.some((event) => event.xrplTime == null)) warnings.push("Some events have no verifiable XRPL timestamp.");
    if (events.some((event) => event.timestampMismatchSeconds != null && Math.abs(event.timestampMismatchSeconds) > 60))
      warnings.push("Stored event timestamps differ from XRPL transaction dates.");
    if (positions.some((position) => position.remaining_tow == null))
      warnings.push("Some commitments have not been reconciled to remaining_tow.");
    if (events.some((event, index) => index > 0 && event.ledgerIndex === events[index - 1].ledgerIndex))
      warnings.push("Multiple transactions share a ledger; intra-ledger transaction order must be checked.");
    const readiness = assessProofMigration({
      verified: Boolean(playerResult.data?.verified),
      proofStartedAt,
      lastScannedLedger: playerResult.data?.last_scanned_ledger == null
        ? null : Number(playerResult.data.last_scanned_ledger),
      eventsCount: events.length,
      // DB row limits and a ledger checkpoint cannot prove full historical coverage.
      eventHistoryComplete: false,
      baselineComplete: Boolean(baseline?.complete),
      lifecycleComplete: lifecycle.complete,
      predictedAliveCount: lifecycle.commitments.filter((p) => p.status === "alive").length,
      predictedDisqualifiedCount: lifecycle.commitments.filter((p) => p.status === "disqualified").length,
      positions: positions.map((p) => ({
        ...p,
        unlocked_reward_tow: Number(p.unlocked_reward_tow ?? 0),
      })),
      eventHistoryWarnings: warnings,
    });
    return NextResponse.json({
      ok: true,
      readOnly: true,
      migrationReadiness: readiness,
      wallet,
      player: playerResult.data,
      counts: {
        events: events.length,
        positions: positions.length,
        active: positions.filter((p) => p.status === "alive").length,
        disqualified: positions.filter((p) => p.status === "disqualified").length,
      },
      warnings,
      baseline: baseline ? { ...baseline, safeToApply: false } : null,
      lifecycle: { ...lifecycle, safeToApply: false },
      costBasis: {
        ...costBasis,
        safeToApply: false,
        currentAlivePositions: positions.filter((p) => p.status === "alive").length,
        differenceFromStoredAlive: costBasis.qualifyingCommitments -
          positions.filter((p) => p.status === "alive").length,
      },
      events,
      positions,
    });
  } catch (error) {
    return NextResponse.json({
      error: "Commitment audit failed",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
