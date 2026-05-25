import { NextRequest, NextResponse } from "next/server";
import { isValidXrplWallet } from "@/lib/towProof";

export const dynamic = "force-dynamic";

function requireAdmin(request: Request) {
  const expected = process.env.TOW_SYNC_SECRET;
  if (!expected) throw new Error("Missing TOW_SYNC_SECRET env var");
  return request.headers.get("x-tow-sync-secret") === expected;
}

export async function POST(request: NextRequest) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const walletAddress = String(body.walletAddress ?? "").trim();

    if (!isValidXrplWallet(walletAddress)) {
      return NextResponse.json({ error: "Invalid XRPL wallet." }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      walletAddress,
      scanned: 0,
      detected: 0,
      results: [],
      note: "Wallet scanner endpoint is wired. XRPL parser should be enabled after testing real TOW buy/sell metadata.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not scan wallet.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
