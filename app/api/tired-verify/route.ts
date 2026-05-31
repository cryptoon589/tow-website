import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isValidXrplWallet } from "@/lib/towProof";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getSupabase() {
  const url =
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function normalizeWallet(wallet: string) {
  return wallet.trim();
}

function normalizeVerificationCode(code: string) {
  return code.trim().toUpperCase();
}

export async function POST(request: Request) {
  try {
    let body: any = null;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid JSON body.",
        },
        { status: 400 }
      );
    }

    const walletAddress = normalizeWallet(
      String(body?.walletAddress ?? "")
    );

    const verificationCode = normalizeVerificationCode(
      String(body?.verificationCode ?? "")
    );

    // Basic validation
    if (!walletAddress) {
      return NextResponse.json(
        {
          ok: false,
          error: "Wallet address is required.",
        },
        { status: 400 }
      );
    }

    if (!isValidXrplWallet(walletAddress)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid XRPL wallet.",
        },
        { status: 400 }
      );
    }

    if (!verificationCode) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing verification code.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Load player
    const { data: player, error: findError } = await supabase
      .from("tow_players")
      .select(
        `
          id,
          wallet_address,
          verification_code,
          verified,
          verified_at
        `
      )
      .eq("wallet_address", walletAddress)
      .maybeSingle();

    if (findError) {
      console.error("[VERIFY_PLAYER_LOAD_ERROR]", findError);

      return NextResponse.json(
        {
          ok: false,
          error: "Could not load player.",
          details: findError.message,
        },
        { status: 500 }
      );
    }

    if (!player) {
      return NextResponse.json(
        {
          ok: false,
          error: "Player is not registered yet.",
        },
        { status: 404 }
      );
    }

    // Already verified
    if (player.verified) {
      return NextResponse.json({
        ok: true,
        verified: true,
        verifiedAt: player.verified_at ?? null,
        message: "Already verified.",
      });
    }

    const storedCode = normalizeVerificationCode(
      String(player.verification_code ?? "")
    );

    // Verification mismatch
    if (!storedCode || storedCode !== verificationCode) {
      return NextResponse.json(
        {
          ok: false,
          error: "Verification code does not match.",
        },
        { status: 400 }
      );
    }

    const verifiedAt = new Date().toISOString();

    // One-time verification:
    // - verify account
    // - invalidate code
    const { error: updateError } = await supabase
      .from("tow_players")
      .update({
        verified: true,
        verified_at: verifiedAt,
        verification_code: null,
      })
      .eq("id", player.id)
      .eq("verified", false);

    if (updateError) {
      console.error("[VERIFY_PLAYER_UPDATE_ERROR]", updateError);

      return NextResponse.json(
        {
          ok: false,
          error: "Could not verify player.",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      verified: true,
      verifiedAt,
      walletAddress,
      message: "Survivor identity verified successfully.",
    });
  } catch (error) {
    console.error("[VERIFY_PLAYER_FATAL]", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Could not process verification.",
        details:
          error instanceof Error
            ? error.message
            : "Unknown server error",
      },
      { status: 500 }
    );
  }
}
