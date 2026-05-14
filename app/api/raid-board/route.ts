import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

async function sendToTelegram(
  username: string,
  postUrl: string
) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return false;
  }

  const message =
    `🚨 New TOW raid post by @${username}\n\n` +
    `Raid it:\n${postUrl}`;

  const url =
    `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        disable_web_page_preview: false,
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();

    const weekId =
      request.nextUrl.searchParams.get("weekId");

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
      data?.map((row) => ({
        id: row.id,
        xUsername: row.x_username,
        wallet: row.wallet,
        telegram: row.telegram,
        postUrl: row.post_url,
        timestamp: row.created_at,
        weekId: row.week_id,
      })) ?? [];

    return NextResponse.json({ posts });
  } catch {
    return NextResponse.json(
      { error: "Could not load raid posts." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const supabase = getSupabase();

    const xUsername = String(
      body.xUsername ?? ""
    ).replace(/^@+/, "").trim();

    const wallet = String(body.wallet ?? "").trim();

    const telegram = String(body.telegram ?? "").trim();

    const postUrl = String(body.postUrl ?? "").trim();

    const weekId = String(body.weekId ?? "").trim();

    if (!xUsername || !wallet || !postUrl || !weekId) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("raid_posts")
      .select("id")
      .eq("post_url", postUrl)
      .eq("week_id", weekId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Duplicate post." },
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

    await sendToTelegram(xUsername, postUrl);

    return NextResponse.json({
      ok: true,
      post: data,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not submit raid post." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id =
      request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing id." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from("raid_posts")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Could not delete post." },
      { status: 500 }
    );
  }
}