import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    const claimId = String(body?.claimId ?? "").trim();
    const txHash = String(body?.txHash ?? "").trim();

    if (!claimId) {
      return NextResponse.json({ error: "Missing claimId." }, { status: 400 });
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from("tow_buy_positions")
      .update({
        reward_status: "sent",
        reward_sent_at: new Date().toISOString(),
        reward_tx_hash: txHash || null,
      })
      .eq("id", claimId)
      .eq("status", "claimed");

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error.",
      },
      { status: 500 }
    );
  }
}
