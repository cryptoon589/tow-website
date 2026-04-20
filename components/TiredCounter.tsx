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

    setTimeout(() => setAnim(false), 250);
    setTimeout(() => setResp(null), 3000);
  };

  return (
    <section className="py-12 md:py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-8">Global Tired Count</h2>

        <div className="mb-8">
          <div
            className={`text-8xl md:text-[10rem] font-black leading-none font-serif transition-transform duration-200 ${
              anim ? "scale-110" : "scale-100"
            }`}
          >
            {count.toLocaleString()}
          </div>
          <p className="text-gray-600 mt-4">tired together</p>
        </div>

        <button
          onClick={click}
          className="px-16 py-7 border-2 border-black bg-white text-black text-3xl font-bold rounded-xl hover:bg-black hover:text-white active:scale-95 transition-all duration-200 shadow-sm"
        >
          TIRED
        </button>

        {resp && <p className="mt-6 text-lg text-gray-600 animate-fade-in">{resp}</p>}

        <div className="mt-10 max-w-2xl mx-auto">
          <p className="text-sm text-gray-500">Press it when the market drains you.</p>
        </div>
      </div>
    </section>
  );
}