import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getHoldDays, isValidXrplWallet } from "@/lib/towProof";

export const dynamic = "force-dynamic";

function getSupabase() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) throw new Error("Missing Supabase env vars");

  return createClient(url, key);
}

function createClaimCode() {
  const partA = Math.random().toString(36).slice(2, 6).toUpperCase();
  const partB = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `TOW-${partA}-${partB}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const wallet = String(body?.wallet ?? "").trim();

const positionId = String(
  body?.positionId ?? ""
).trim();

    if (!positionId) {
  return NextResponse.json(
    { error: "Missing commitment position." },
    { status: 400 }
  );
}

    if (!isValidXrplWallet(wallet)) {
      return NextResponse.json({ error: "Invalid wallet." }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: player, error: playerError } = await supabase
      .from("tow_players")
      .select("verified,x_username,telegram_username")
      .eq("wallet_address", wallet)
      .maybeSingle();

    if (playerError) throw playerError;

    if (!player?.verified) {
      return NextResponse.json(
        { error: "Verify your survivor identity before requesting a claim." },
        { status: 403 }
      );
    }

    if (!player.telegram_username) {
      return NextResponse.json(
        { error: "A linked Telegram username is required for claim authorization." },
        { status: 403 }
      );
    }

    const { data: activeRequest, error: activeRequestError } = await supabase
      .from("tow_claim_requests")
      .select("claim_code,status,expires_at,position_id")
      .eq("position_id", positionId)
      .eq("wallet_address", wallet)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeRequestError) throw activeRequestError;

    if (activeRequest) {
      return NextResponse.json({
        ok: true,
        reused: true,
        claimCode: activeRequest.claim_code,
        expiresAt: activeRequest.expires_at,
        instructions: `Send /claim ${activeRequest.claim_code} to TiredBuddy from your linked Telegram account.`,
      });
    }

    const { data: positions, error: positionError } = await supabase
      .from("tow_buy_positions")
      .select("id,created_at,status")
      .eq("wallet_address", wallet)
      .eq("status", "alive");

    if (positionError) throw positionError;

const selectedPosition = (positions ?? []).find(
  (position) =>
    String(position.id) === positionId &&
    getHoldDays(position.created_at) >= 28
);

if (!selectedPosition) {
  return NextResponse.json(
    {
      error:
        "Selected commitment is not claimable."
    },
    { status: 400 }
  );
}

    const claimCode = createClaimCode();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString();

    const { error: insertError } = await supabase.from("tow_claim_requests").insert({
      wallet_address: wallet,
      x_username: player.x_username ?? null,
      telegram_username: player.telegram_username,
      claim_code: claimCode,
      status: "pending",
      position_id: positionId,
      eligible_position_ids: [positionId],
      expires_at: expiresAt,
    });

    if (insertError) throw insertError;

    return NextResponse.json({
      ok: true,
      reused: false,
      claimCode,
      expiresAt,
      claimableCommitments: 1,
      instructions: `Send /claim ${claimCode} to TiredBuddy from @${player.telegram_username}.`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not create claim request.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
