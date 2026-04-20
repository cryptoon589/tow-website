"use client";

import { useState, useEffect } from "react";
import { tiredResponses } from "@/config/site";

export default function TiredCounter({
  initialCount = 0,
}: {
  initialCount?: number;
}) {
  const [count, setCount] = useState(initialCount);
  const [resp, setResp] = useState<string | null>(null);
  const [anim, setAnim] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem("tow-tired-count");
    if (s) setCount(parseInt(s, 10));
  }, []);

  const click = () => {
    const n = count + 1;
    setCount(n);
    localStorage.setItem("tow-tired-count", n.toString());

    setResp(tiredResponses[Math.floor(Math.random() * tiredResponses.length)]);
    setAnim(true);

    setTimeout(() => setAnim(false), 220);
    setTimeout(() => setResp(null), 2500);
  };

  return (
    <section className="pt-6 pb-12 md:pt-8 md:pb-14 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-xl md:text-2xl font-bold mb-4">Global Tired Count</h2>

        <div className="mb-4">
          <div
            className={`text-8xl md:text-[9rem] font-black leading-none tracking-tight transition-transform duration-200 ${
              anim ? "scale-110" : "scale-100"
            }`}
          >
            {count.toLocaleString()}
          </div>
          <p className="text-gray-700 mt-3 text-lg">tired together</p>
        </div>

        <button
          onClick={click}
          className="mt-6 px-20 py-8 border-2 border-black bg-white text-black text-4xl font-black tracking-wide rounded-2xl cursor-pointer transition-all duration-150 shadow-sm hover:bg-black hover:text-white hover:-translate-y-1 active:scale-90 active:translate-y-1"
        >
          TIRED
        </button>

        {resp && (
          <p className="mt-5 text-lg font-medium text-gray-800 animate-fade-in">
            {resp}
          </p>
        )}

        <div className="mt-8 max-w-2xl mx-auto">
          <p className="text-base text-gray-600">
            Press it when the market drains you.
          </p>
        </div>
      </div>
    </section>
  );
}