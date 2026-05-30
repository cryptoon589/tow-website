import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getHoldDays, isValidXrplWallet } from "@/lib/towProof";

export const dynamic = "force-dynamic";

function getSupabase() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase env vars");
  }

  return createClient(url, key);
}

function requireClaimAdmin(request: NextRequest) {
  const expected = process.env.TOW_CLAIM_SECRET ?? process.env.TOW_SYNC_SECRET;

  if (!expected) {
    throw new Error("Missing TOW_CLAIM_SECRET or TOW_SYNC_SECRET env var");
  }

  return request.headers.get("x-tow-claim-secret") === expected;
}

export async function POST(request: NextRequest) {
  try {
    if (!requireClaimAdmin(request)) {
      return NextResponse.json(
        {
          error:
            "Claim requests are locked until verified claim authorization is enabled.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const wallet = String(body?.wallet ?? "").trim();

    if (!isValidXrplWallet(wallet)) {
      return NextResponse.json({ error: "Invalid wallet." }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: player, error: playerError } = await supabase
      .from("tow_players")
      .select("verified")
      .eq("wallet_address", wallet)
      .maybeSingle();

    if (playerError) {
      throw playerError;
    }

    if (!player?.verified) {
      return NextResponse.json(
        { error: "Wallet must be registered and verified before claiming." },
        { status: 403 }
      );
    }

    const { data: positions, error: fetchError } = await supabase
      .from("tow_buy_positions")
      .select("id,created_at,status")
      .eq("wallet_address", wallet)
      .eq("status", "alive");

    if (fetchError) {
      throw fetchError;
    }

    const eligibleIds = (positions ?? [])
      .filter((position) => getHoldDays(position.created_at) >= 28)
      .map((position) => position.id);

    if (eligibleIds.length === 0) {
      return NextResponse.json(
        { error: "No claimable commitments found." },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("tow_buy_positions")
      .update({
        status: "claimed",
        claimed_at: new Date().toISOString(),
        reward_status: "pending",
      })
      .in("id", eligibleIds)
      .eq("status", "alive");

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      claimedCommitments: eligibleIds.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error.",
      },
      { status: 500 }
    );
  }
}
