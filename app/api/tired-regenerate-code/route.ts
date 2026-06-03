import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isValidXrplWallet } from "@/lib/towProof";

export const dynamic = "force-dynamic";

function getSupabase() {
  const url =
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase env vars");
  }

  return createClient(url, key);
}

function createVerificationCode() {
  const partA = Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase();

  const partB = Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase();

  return `TOW-${partA}-${partB}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const wallet = String(body?.wallet ?? "").trim();

    if (!isValidXrplWallet(wallet)) {
      return NextResponse.json(
        { error: "Invalid wallet." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: player, error: playerError } =
      await supabase
        .from("tow_players")
        .select("id,verified")
        .eq("wallet_address", wallet)
        .maybeSingle();

    if (playerError) throw playerError;

    if (!player) {
      return NextResponse.json(
        { error: "Survivor identity not found." },
        { status: 404 }
      );
    }

    if (player.verified) {
      return NextResponse.json(
        { error: "This survivor identity is already verified." },
        { status: 409 }
      );
    }

    const verificationCode = createVerificationCode();

    const { error: updateError } = await supabase
      .from("tow_players")
      .update({
        verification_code: verificationCode,
        verified: false,
      })
      .eq("id", player.id);

    if (updateError) throw updateError;

    return NextResponse.json({
      ok: true,
      verificationCode,
      instructions: `Send /verify ${verificationCode} to TiredBuddy in DM.`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not generate new verification code.",
        details:
          error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}