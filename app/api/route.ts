import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { replayTowCommitments, type TowLedgerEvent } from "@/lib/towCommitmentEngine";

export const dynamic = "force-dynamic";

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase configuration missing");
  return createClient(url, key);
}

function rippleTime(raw: any): string | null {
  const tx = raw?.tx ?? raw?.tx_json ?? raw;
  const seconds = tx?.date;
  if (typeof seconds === "number" && Number.isFinite(seconds))
    return new Date((seconds + 946684800) * 1000).toISOString();
  if (typeof seconds === "string" && /^\d+$/.test(seconds))
    return new Date((Number(seconds) + 946684800) * 1000).toISOString();
  const iso = tx?.close_time_iso ?? tx?.date_iso ?? raw?.close_time_iso;
  if (typeof iso === "string" && Number.isFinite(Date.parse(iso)))
    return new Date(iso).toISOString();
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.TOW_SYNC_SECRET;
    if (!secret || request.headers.get("x-tow-sync-secret") !== secret)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const walletAddress = String(body.walletAddress ?? "").trim();
    if (!/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(walletAddress))
      return NextResponse.json({ error: "Invalid wallet" }, { status: 400 });
    const db = supabaseAdmin();
    const { data: player, error: playerError } = await db.from("tow_players")
      .select("wallet_address,verified,proof_started_at,last_scanned_ledger")
      .eq("wallet_address", walletAddress).maybeSingle();
    if (playerError) throw playerError;
    if (!player?.verified || !player.proof_started_at)
      return NextResponse.json({ error: "Verified player with proof start required" }, { status: 400 });

    // Fetch every row, rather than Supabase's default 1,000-row window.
    const rows: any[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await db.from("tow_wallet_events")
        .select("tx_hash,event_type,xrp_value,tow_amount,ledger_index,event_at,raw_event")
        .eq("wallet_address", walletAddress)
        .order("ledger_index", { ascending: true })
        .range(offset, offset + 499);
      if (error) throw error;
      rows.push(...(data ?? []));
      if (!data || data.length < 500) break;
      if (offset >= 9500) return NextResponse.json({ error: "Too many events for audit" }, { status: 422 });
    }
    const issues: string[] = [];
    const events: TowLedgerEvent[] = [];
    for (const r of rows) {
      const actualTime = rippleTime(r.raw_event);
      if (!actualTime) issues.push(`Missing ledger timestamp: ${r.tx_hash}`);
      if (actualTime && Math.abs(Date.parse(actualTime) - Date.parse(r.event_at)) > 60_000)
        issues.push(`Stored event_at differs from XRPL time: ${r.tx_hash}`);
      if (!Number.isSafeInteger(Number(r.ledger_index)) || Number(r.ledger_index) <= 0)
        issues.push(`Missing ledger index: ${r.tx_hash}`);
      if (!actualTime) continue;
      events.push({
        txHash: r.tx_hash, ledgerIndex: Number(r.ledger_index), eventAt: actualTime,
        eventType: r.event_type, xrpValue: Number(r.xrp_value), towAmount: Number(r.tow_amount),
      });
    }
    const { data: existing, error: positionsError } = await db.from("tow_buy_positions")
      .select("id,buy_tx_hash,buy_value_xrp,tow_amount,remaining_tow,status,created_at,disqualified_at,claimed_at,reward_status,reward_sent_at,reward_tx_hash,unlocked_reward_tow")
      .eq("wallet_address", walletAddress).order("created_at", { ascending: true });
    if (positionsError) throw positionsError;
    if (issues.length) return NextResponse.json({
      ok: false, safeToApply: false, walletAddress,
      message: "Historical event data needs repair before reconciliation. No database changes made.",
      issues, eventsRead: rows.length, existingPositions: existing?.length ?? 0,
    }, { status: 422 });
    const replay = replayTowCommitments(events, player.proof_started_at);
    return NextResponse.json({
      ok: true, safeToApply: false, mode: "READ_ONLY", walletAddress,
      eventsRead: rows.length,
      current: { positions: existing?.length ?? 0,
        alive: existing?.filter(p => p.status === "alive").length ?? 0,
        withRewardHistory: existing?.filter(p => p.claimed_at || p.reward_sent_at || p.reward_tx_hash).length ?? 0 },
      proposed: { positions: replay.commitments.length,
        alive: replay.commitments.filter(p => p.status === "alive").length,
        disqualified: replay.commitments.filter(p => p.status === "disqualified").length,
        commitments: replay.commitments },
      warnings: replay.warnings,
      message: "Diagnostic only. Does not insert, update, or disqualify positions.",
    });
  } catch (e) {
    return NextResponse.json({ error: "Audit failed", details: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
