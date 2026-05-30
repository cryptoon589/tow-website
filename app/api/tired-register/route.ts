import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  isValidXUsername,
  isValidXrplWallet,
  normalizeXUsername,
} from "@/lib/towProof";

export const dynamic = "force-dynamic";

function getSupabase() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) throw new Error("Missing Supabase env vars");

  return createClient(url, key);
}

function createVerificationCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const walletAddress = String(body.walletAddress ?? "").trim();
    const telegramUsername = String(body.telegramUsername ?? "")
      .trim()
      .replace(/^@+/, "");

    const xUsername = normalizeXUsername(
      String(body.xUsername ?? "").trim()
    );

    if (!isValidXrplWallet(walletAddress)) {
      return NextResponse.json(
        { error: "Invalid XRPL wallet." },
        { status: 400 }
      );
    }

    if (xUsername && !isValidXUsername(xUsername)) {
      return NextResponse.json(
        { error: "Invalid X username." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Preserve existing verification state if player already exists.
    const { data: existingPlayer } = await supabase
      .from("tow_players")
      .select("verified,verified_at")
      .eq("wallet_address", walletAddress)
      .maybeSingle();

    const verificationCode = createVerificationCode();

    const { data, error } = await supabase
      .from("tow_players")
      .upsert(
        {
          wallet_address: walletAddress,
          x_username: xUsername || null,
          telegram_username: telegramUsername || null,
          verification_code: verificationCode,
          verified: existingPlayer?.verified ?? false,
          verified_at: existingPlayer?.verified_at ?? null,
        },
        { onConflict: "wallet_address" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: "Could not register player.",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      player: {
        walletAddress: data.wallet_address,
        xUsername: data.x_username,
        telegramUsername: data.telegram_username,
        verified: data.verified,
      },
      verificationCode,
      instructions:
        "Send this verification code through TiredBuddy or place it in an X post to verify ownership later.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not process registration.",
        details:
          error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
