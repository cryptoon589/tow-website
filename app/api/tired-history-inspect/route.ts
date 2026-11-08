import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isValidXrplWallet } from "@/lib/towProof";
import { inspectAccountTxCoverage } from "@/lib/towAccountTxCoverage";
import { inspectTowDelta } from "@/lib/towLedgerMovementInspection";
import { auditTowMovements, type StoredTowMovement } from "@/lib/towMovementAudit";

export const dynamic = "force-dynamic";

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
    const rpcUrl = process.env.XRPL_RPC_URL;
    const dbUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const dbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!rpcUrl || !dbUrl || !dbKey) {
      throw new Error("Missing XRPL or Supabase configuration");
    }

    const db = createClient(dbUrl, dbKey);
    const { data: player, error: playerError } = await db
      .from("tow_players").select("wallet_address,verified,last_scanned_ledger")
      .eq("wallet_address", wallet).maybeSingle();
    if (playerError) throw playerError;
    if (!player) return NextResponse.json({ error: "Wallet not registered" }, { status: 404 });

    // This is a bounded inspection, NOT a scan or sync. No cursor writes.
    const maxPages = 10;
    const pageLimit = 200;
    const issuer = String(process.env.TOW_ISSUER ?? "");
    const currency = String(process.env.TOW_CURRENCY ?? "TOW");
    if (!issuer) throw new Error("Missing TOW_ISSUER");
    const rpcHashes: string[] = [];
    const movementCandidates: ReturnType<typeof inspectTowDelta>[] = [];
    let marker: unknown = undefined;
    let paginationExhausted = false;
    let pagesFetched = 0;
    for (let page = 0; page < maxPages; page++) {
      const params: Record<string, unknown> = {
        account: wallet,
        ledger_index_min: -1,
        ledger_index_max: -1,
        forward: true,
        binary: false,
        limit: pageLimit,
      };
      if (marker !== undefined) params.marker = marker;
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "account_tx", params: [params] }),
        cache: "no-store",
      });
      if (!response.ok) throw new Error("XRPL RPC HTTP error");
      const json = await response.json();
      if (json?.error || json?.result?.error) throw new Error("XRPL account_tx RPC error");
      const transactions = json?.result?.transactions;
      if (!Array.isArray(transactions)) throw new Error("Malformed account_tx response");
      for (const entry of transactions) {
        const hash = entry?.tx_json?.hash ?? entry?.tx?.hash ?? entry?.hash;
        rpcHashes.push(String(hash ?? ""));
        const inspection = inspectTowDelta(entry, wallet, issuer, currency);
        if (inspection.hasTowMovement || !inspection.reliable) movementCandidates.push(inspection);
      }
      pagesFetched++;
      marker = json?.result?.marker;
      if (marker === undefined || marker === null) {
        paginationExhausted = true;
        break;
      }
    }

    const storedHashes: string[] = [];
    const storedMovements: StoredTowMovement[] = [];
    let storedTruncated = false;
    for (let page = 0; page < 20; page++) {
      const { data, error } = await db.from("tow_wallet_events")
        .select("tx_hash,event_type,tow_amount").eq("wallet_address", wallet)
        .order("id", { ascending: true })
        .range(page * 1000, page * 1000 + 999);
      if (error) throw error;
      const rows = data ?? [];
      storedHashes.push(...rows.map((row) => String(row.tx_hash)));
      storedMovements.push(...rows.map((row) => ({ tx_hash: String(row.tx_hash), event_type: String(row.event_type), tow_amount: row.tow_amount })));
      if (rows.length < 1000) break;
      if (page === 19) storedTruncated = true;
    }
    const coverage = inspectAccountTxCoverage(
      rpcHashes, storedHashes, paginationExhausted && !storedTruncated
    );
    if (storedTruncated) coverage.warnings.push("Stored event query hit the 20,000-row safety cap.");
    const storedSet = new Set(storedHashes.map((hash) => hash.toUpperCase()));
    const missingTowCandidates = movementCandidates.filter((movement) =>
      movement.hasTowMovement && !storedSet.has(movement.hash)
    );
    const unreliableTransactions = movementCandidates.filter((movement) => !movement.reliable);
    const movementAudit = auditTowMovements(movementCandidates, storedMovements, paginationExhausted, storedTruncated);
    return NextResponse.json({
      ok: true,
      readOnly: true,
      wallet,
      pagesFetched,
      rpcPaginationExhausted: paginationExhausted,
      storedTruncated,
      coverage,
      movementAudit,
      missingTowCandidates,
      unreliableTransactions,
      towMovementCandidatesInspected: movementCandidates.filter((movement) => movement.hasTowMovement).length,
      note: "This inspection does not verify TOW classification, historical balance, or migration eligibility.",
    });
  } catch (error) {
    return NextResponse.json({
      error: "XRPL history inspection failed",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
