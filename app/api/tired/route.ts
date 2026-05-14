import { NextResponse } from "next/server";
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

export async function GET() {
  try {
    const supabase = getSupabase();

    const { count, error } = await supabase
      .from("tired_clicks")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (error) throw error;

    return NextResponse.json({
      count: count ?? 0,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not load tired count." },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const supabase = getSupabase();

    const { error: insertError } = await supabase
      .from("tired_clicks")
      .insert({});

    if (insertError) throw insertError;

    const { count, error: countError } = await supabase
      .from("tired_clicks")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (countError) throw countError;

    return NextResponse.json({
      count: count ?? 0,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not update tired count." },
      { status: 500 }
    );
  }
}