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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const wallet = String(body?.wallet ?? "").trim();

    if (!isValidXrplWallet(wallet)) {
      return NextResponse.json({ error: "Invalid wallet." }, { status: 400 });
    }

    const supabase = getSupabase();

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
      return NextResponse.json({ error: "No claimable commitments found." }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("tow_buy_positions")
      .update({
        status: "claimed",
        claimed_at: new Date().toISOString(),
        reward_status: "pending",
      })
      .in("id", eligibleIds);

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
