import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getSupabase() {
  const url =
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase environment variables."
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
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

    const verificationCode =
      normalizeVerificationCode(
        String(body?.verificationCode ?? "")
      );

    const telegramUsername = String(
      body?.telegramUsername ?? ""
    )
      .trim()
      .replace(/^@+/, "")
      .toLowerCase();

    /*
     * Basic validation
     */

    if (!verificationCode) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing verification code.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    /*
     * Load player by verification code
     */

    const {
      data: player,
      error: findError,
    } = await supabase
      .from("tow_players")
      .select(
        `
          id,
          wallet_address,
          x_username,
          telegram_username,
          verification_code,
          verified,
          verified_at
        `
      )
      .eq(
        "verification_code",
        verificationCode
      )
      .maybeSingle();

    if (findError) {
      console.error(
        "[VERIFY_PLAYER_LOAD_ERROR]",
        findError
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Could not load player.",
          details: findError.message,
        },
        { status: 500 }
      );
    }

    if (!player) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid verification code.",
        },
        { status: 404 }
      );
    }

    /*
     * Telegram identity validation
     */

    if (
      player.telegram_username &&
      telegramUsername &&
      String(
        player.telegram_username
      ).toLowerCase() !==
        telegramUsername
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Telegram username mismatch.",
        },
        { status: 403 }
      );
    }

    /*
     * Already verified
     */

    if (player.verified) {
      return NextResponse.json({
        ok: true,
        verified: true,
        alreadyVerified: true,
        verifiedAt:
          player.verified_at ?? null,
        player: {
          walletAddress:
            player.wallet_address,
          xUsername:
            player.x_username,
        },
        message: "Already verified.",
      });
    }

    const verifiedAt =
      new Date().toISOString();

    /*
     * One-time verification:
     * - verify account
     * - invalidate code forever
     */

    const { error: updateError } =
      await supabase
        .from("tow_players")
        .update({
          verified: true,
          verified_at: verifiedAt,
          verification_code: null,
        })
        .eq("id", player.id)
        .eq("verified", false);

    if (updateError) {
      console.error(
        "[VERIFY_PLAYER_UPDATE_ERROR]",
        updateError
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Could not verify player.",
          details:
            updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      verified: true,
      verifiedAt,
      player: {
        walletAddress:
          player.wallet_address,
        xUsername: player.x_username,
      },
      message:
        "Survivor identity verified successfully.",
    });
  } catch (error) {
    console.error(
      "[VERIFY_PLAYER_FATAL]",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "Could not process verification.",
        details:
          error instanceof Error
            ? error.message
            : "Unknown server error",
      },
      { status: 500 }
    );
  }
}
