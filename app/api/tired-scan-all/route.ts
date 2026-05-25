import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

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

function getBaseUrl(request: NextRequest) {
  const configured = process.env.TOW_WEBSITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host = request.headers.get("host");
  return `${proto}://${host}`;
}

export async function POST(request: NextRequest) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const limit = Math.min(200, Math.max(1, Number(body.limit ?? 50)));
    const maxWallets = Math.min(100, Math.max(1, Number(body.maxWallets ?? 25)));
    const supabase = getSupabase();

    const { data: players, error } = await supabase
      .from("tow_players")
      .select("wallet_address")
      .order("updated_at", { ascending: false })
      .limit(maxWallets);

    if (error) throw error;

    const baseUrl = getBaseUrl(request);
    const results = [];

    for (const player of players ?? []) {
      const walletAddress = String(player.wallet_address ?? "").trim();
      if (!walletAddress) continue;

      try {
        const response = await fetch(`${baseUrl}/api/tired-scan-wallet`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tow-sync-secret": request.headers.get("x-tow-sync-secret") ?? "",
          },
          body: JSON.stringify({ walletAddress, limit }),
        });

        const data = await response.json().catch(() => null);
        results.push({
          walletAddress,
          ok: response.ok,
          status: response.status,
          detected: data?.detected ?? 0,
          scanned: data?.scanned ?? 0,
          note: data?.note,
          error: data?.error,
        });
      } catch (walletError) {
        results.push({
          walletAddress,
          ok: false,
          error: walletError instanceof Error ? walletError.message : String(walletError),
        });
      }
    }

    return NextResponse.json({ ok: true, scannedWallets: results.length, results });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not scan registered wallets.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
