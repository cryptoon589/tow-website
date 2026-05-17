import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type RaidPostBody = {
  xUsername?: string;
  wallet?: string;
  telegram?: string;
  postUrl?: string;
  weekId?: string;
};

function getSupabase() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase env vars");
  }

  return createClient(url, key);
}

function normalizeHandle(value: string) {
  return value.trim().replace(/^@+/, "");
}

function isValidXUsername(value: string) {
  return /^[A-Za-z0-9_]{1,15}$/.test(normalizeHandle(value));
}

function isValidXUrl(value: string) {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./, "");
    const parts = parsed.pathname.split("/").filter(Boolean);

    return (
      (host === "x.com" || host === "twitter.com") &&
      parts.length >= 3 &&
      parts[1] === "status"
    );
  } catch {
    return false;
  }
}

async function sendToTelegram(username: string, postUrl: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return {
      ok: false,
      reason: "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID",
    };
  }

  const message =
    `🚨 New TOW raid post by @${normalizeHandle(username)}\n\n` +
    `Raid it:\n${postUrl}`;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          disable_web_page_preview: false,
        }),
      }
    );

    const data = await response.json().catch(() => null);

    return {
      ok: response.ok,
      status: response.status,
      description: data?.description,
    };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const weekId = request.nextUrl.searchParams.get("weekId");

    let query = supabase
      .from("raid_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (weekId) {
      query = query.eq("week_id", weekId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const posts =
      data?.map((post) => ({
        id: post.id,
        xUsername: normalizeHandle(post.x_username ?? ""),
        wallet: post.wallet,
        telegram: normalizeHandle(post.telegram ?? ""),
        postUrl: post.post_url,
        timestamp: post.created_at,
        weekId: post.week_id,
      })) ?? [];

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Raid board GET error:", error);

    return NextResponse.json(
      {
        error: "Could not load raid posts.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RaidPostBody;
    const supabase = getSupabase();

    const xUsername = normalizeHandle(body.xUsername ?? "");
    const wallet = String(body.wallet ?? "").trim();
    const telegram = normalizeHandle(body.telegram ?? "");
    const postUrl = String(body.postUrl ?? "").trim();
    const weekId = String(body.weekId ?? "").trim();

    if (!isValidXUsername(xUsername)) {
      return NextResponse.json(
        { error: "Invalid X username." },
        { status: 400 }
      );
    }

    if (!wallet || wallet.length < 10) {
      return NextResponse.json(
        { error: "Invalid wallet." },
        { status: 400 }
      );
    }

    if (!isValidXUrl(postUrl)) {
      return NextResponse.json(
        { error: "Invalid X post URL." },
        { status: 400 }
      );
    }

    if (!weekId) {
      return NextResponse.json(
        { error: "Missing week id." },
        { status: 400 }
      );
    }

    const { data: existing, error: duplicateError } = await supabase
      .from("raid_posts")
      .select("id")
      .eq("post_url", postUrl)
      .eq("week_id", weekId)
      .maybeSingle();

    if (duplicateError) throw duplicateError;

    if (existing) {
      return NextResponse.json(
        { error: "This post was already submitted this week." },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("raid_posts")
      .insert({
        x_username: xUsername,
        wallet,
        telegram,
        post_url: postUrl,
        week_id: weekId,
      })
      .select()
      .single();

    if (error) throw error;

    const telegramResult = await sendToTelegram(xUsername, postUrl);

    return NextResponse.json({
      ok: true,
      post: data,
      telegramSent: telegramResult.ok,
      telegramResult,
    });
  } catch (error) {
    console.error("Raid board POST error:", error);

    return NextResponse.json(
      {
        error: "Could not submit raid post.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id." }, { status: 400 });
    }

    const supabase = getSupabase();

    const { error } = await supabase.from("raid_posts").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Raid board DELETE error:", error);

    return NextResponse.json(
      {
        error: "Could not delete post.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
