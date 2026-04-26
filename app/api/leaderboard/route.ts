import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type SubmitBody = {
  xUsername?: string;
  walletAddress?: string;
  score?: number;
};

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase env vars");
  }

  return createClient(url, key);
}

function getWeeklyKey() {
  const now = new Date();
  const firstDay = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const dayNumber = Math.floor(
    (now.getTime() - firstDay.getTime()) / 86400000
  );
  const weekNumber = Math.ceil((dayNumber + firstDay.getUTCDay() + 1) / 7);

  return `${now.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

function normalizeXUsername(value: string) {
  return value.trim().replace(/^@+/, "");
}

function isValidXUsername(value: string) {
  return /^[A-Za-z0-9_]{1,15}$/.test(normalizeXUsername(value));
}

function isValidXrplWallet(value: string) {
  return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(value.trim());
}

export async function GET() {
  try {
    const supabase = getSupabase();
    const weeklyKey = getWeeklyKey();

    const { data, error } = await supabase
      .from("tow_weekly_scores")
      .select(
        "id,x_username,wallet_address,best_score,last_score,runs,updated_at"
      )
      .eq("weekly_key", weeklyKey)
      .order("best_score", { ascending: false })
      .order("updated_at", { ascending: true })
      .limit(10);

    if (error) throw error;

    return NextResponse.json({
      weeklyKey,
      entries:
        data?.map((entry) => ({
          id: entry.id,
          xUsername: entry.x_username,
          walletAddress: entry.wallet_address,
          bestScore: entry.best_score,
          score: entry.last_score,
          runs: entry.runs,
          lastPlayedAt: entry.updated_at,
        })) ?? [],
    });
  } catch {
    return NextResponse.json(
      { error: "Could not load leaderboard." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubmitBody;

    const xUsername = normalizeXUsername(body.xUsername ?? "");
    const walletAddress = (body.walletAddress ?? "").trim();
    const score = Number(body.score ?? 0);

    if (!isValidXUsername(xUsername)) {
      return NextResponse.json({ error: "Invalid X username." }, { status: 400 });
    }

    if (!isValidXrplWallet(walletAddress)) {
      return NextResponse.json({ error: "Invalid XRPL wallet." }, { status: 400 });
    }

    if (!Number.isFinite(score) || score < 0 || score > 999999) {
      return NextResponse.json({ error: "Invalid score." }, { status: 400 });
    }

    const supabase = getSupabase();
    const weeklyKey = getWeeklyKey();

    const { data: existing } = await supabase
      .from("tow_weekly_scores")
      .select("id,best_score,runs")
      .eq("weekly_key", weeklyKey)
      .eq("wallet_address", walletAddress)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("tow_weekly_scores")
        .update({
          x_username: xUsername,
          last_score: score,
          best_score: Math.max(existing.best_score, score),
          runs: existing.runs + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) throw error;
    } else {
      const { error } = await supabase.from("tow_weekly_scores").insert({
        weekly_key: weeklyKey,
        x_username: xUsername,
        wallet_address: walletAddress,
        last_score: score,
        best_score: score,
        runs: 1,
      });

      if (error) throw error;
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Could not submit score." },
      { status: 500 }
    );
  }
}