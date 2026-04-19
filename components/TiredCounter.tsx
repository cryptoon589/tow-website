"use client";
import { useState, useEffect } from "react";
import { tiredResponses } from "@/config/site";
export default function TiredCounter({ initialCount = 0 }: { initialCount?: number }) {
  const [count, setCount] = useState(initialCount);
  const [resp, setResp] = useState<string | null>(null);
  const [anim, setAnim] = useState(false);
  useEffect(() => { const s = localStorage.getItem("tow-tired-count"); if (s) setCount(parseInt(s, 10)); }, []);
  const click = () => {
    const n = count + 1; setCount(n); localStorage.setItem("tow-tired-count", n.toString());
    setResp(tiredResponses[Math.floor(Math.random() * tiredResponses.length)]);
    setAnim(true); setTimeout(() => setAnim(false), 300); setTimeout(() => setResp(null), 3000);
  };
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-8">Global Tired Count</h2>
        <div className="mb-8"><div className={`text-7xl md:text-9xl font-bold transition-transform ${anim ? "scale-110" : "scale-100"}`}>{count.toLocaleString()}</div><p className="text-gray-600 mt-4">souls too tired to quit</p></div>
        <button onClick={click} className="px-12 py-6 bg-black text-white text-2xl font-bold rounded-lg hover:bg-gray-800 active:scale-95 transition-all shadow-lg">TIRED</button>
        {resp && <p className="mt-6 text-lg text-gray-600 animate-fade-in">{resp}</p>}
        <div className="mt-12 max-w-2xl mx-auto"><p className="text-sm text-gray-500">Press the button when you are tired. The count goes up. That is it.</p></div>
      </div>
    </section>
  );
}