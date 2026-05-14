"use client";

import { useEffect, useState } from "react";
import { tiredResponses } from "@/config/site";

export default function TiredCounter({
  initialCount = 0,
}: {
  initialCount?: number;
}) {
  const [count, setCount] = useState(initialCount);
  const [resp, setResp] = useState<string | null>(null);
  const [anim, setAnim] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function refreshCount() {
    try {
      const response = await fetch("/api/tired", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) return;

      const data = await response.json();

      setCount(data.count ?? 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshCount();

    const interval = window.setInterval(refreshCount, 10000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const click = async () => {
    if (submitting) return;

    setSubmitting(true);

    try {
      const response = await fetch("/api/tired", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();

        setCount(data.count ?? count + 1);
      } else {
        setCount((prev) => prev + 1);
      }
    } catch {
      setCount((prev) => prev + 1);
    } finally {
      setSubmitting(false);
    }

    setResp(
      tiredResponses[
        Math.floor(Math.random() * tiredResponses.length)
      ]
    );

    setAnim(true);

    window.setTimeout(() => setAnim(false), 220);
    window.setTimeout(() => setResp(null), 2500);
  };

  return (
    <section className="bg-gray-50 pb-12 pt-6 md:pb-14 md:pt-8">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <h2 className="mb-4 text-xl font-bold md:text-2xl">
          Global Tired Count
        </h2>

        <div className="mb-4">
          <div
            className={`text-8xl font-black leading-none tracking-tight transition-transform duration-200 md:text-[9rem] ${
              anim ? "scale-110" : "scale-100"
            }`}
          >
            {loading ? "..." : count.toLocaleString()}
          </div>

          <p className="mt-3 text-lg text-gray-700">
            tired together
          </p>
        </div>

        <button
          onClick={click}
          disabled={submitting}
          className="mt-6 cursor-pointer rounded-2xl border-2 border-black bg-white px-20 py-8 text-4xl font-black tracking-wide text-black shadow-sm transition-all duration-150 hover:-translate-y-1 hover:bg-black hover:text-white active:translate-y-1 active:scale-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "..." : "TIRED"}
        </button>

        {resp && (
          <p className="mt-5 animate-fade-in text-lg font-medium text-gray-800">
            {resp}
          </p>
        )}

        <div className="mx-auto mt-8 max-w-2xl">
          <p className="text-base text-gray-600">
            Press it when the market drains you.
          </p>
        </div>
      </div>
    </section>
  );
}