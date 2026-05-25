import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isValidXrplWallet } from "@/lib/towProof";

export const dynamic = "force-dynamic";

function getSupabase() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase env vars");
  }

  return createClient(url, key);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const walletAddress = String(body.walletAddress ?? "").trim();
    const verificationCode = String(body.verificationCode ?? "").trim().toUpperCase();

    if (!isValidXrplWallet(walletAddress)) {
      return NextResponse.json({ error: "Invalid XRPL wallet." }, { status: 400 });
    }

    if (!verificationCode) {
      return NextResponse.json({ error: "Missing verification code." }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: player, error: findError } = await supabase
      .from("tow_players")
      .select("id,wallet_address,verification_code,verified")
      .eq("wallet_address", walletAddress)
      .maybeSingle();

    if (findError) {
      return NextResponse.json(
        { error: "Could not load player.", details: findError.message },
        { status: 500 }
      );
    }

    if (!player) {
      return NextResponse.json({ error: "Player is not registered yet." }, { status: 404 });
    }

    if (player.verified) {
      return NextResponse.json({ ok: true, verified: true, message: "Already verified." });
    }

    if (String(player.verification_code ?? "").toUpperCase() !== verificationCode) {
      return NextResponse.json({ error: "Verification code does not match." }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("tow_players")
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq("id", player.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Could not verify player.", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, verified: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not process verification.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
