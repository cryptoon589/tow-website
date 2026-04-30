"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TiredCounter from "@/components/TiredCounter";

const heroImages = [
  "/assets/characters/hero-1.png",
  "/assets/characters/hero-2.png",
  "/assets/characters/hero-3.png",
  "/assets/characters/hero-4.png",
];

export default function HeroSection() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % heroImages.length);
    }, 3200);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="pb-6 pt-2 md:pb-8 md:pt-2">
      <div className="mx-auto grid max-w-6xl items-start gap-6 px-4 lg:grid-cols-[1fr_430px]">
        {/* HERO CONTENT */}
        <div className="order-2 pt-3 lg:order-1 lg:pt-6">
          <h1 className="mb-4 text-3xl font-bold leading-[1.18] md:text-4xl lg:text-5xl">
            Still tired. Still here.
          </h1>

          <p className="mb-4 text-base text-gray-600 md:text-xl lg:text-2xl">
            Tired now. Tired of winning later.
          </p>

          {/* Smaller image + much less bottom margin */}
          <div className="mb-1 aspect-square w-full max-w-[340px] overflow-hidden rounded-2xl bg-white md:max-w-[390px] lg:max-w-[430px]">
            <img
              src={heroImages[index]}
              alt="TOW Character"
              className="h-full w-full object-contain transition-opacity duration-500"
            />
          </div>

          {/* Pull buttons upward */}
          <div className="-mt-6 flex flex-wrap gap-3 md:-mt-8">
            <Link
              href="/meme-generator"
              className="rounded bg-black px-6 py-3 font-bold text-white transition hover:bg-gray-800"
            >
              Make Memes
            </Link>

            <Link
              href="/raid-board"
              className="rounded border-2 border-black px-6 py-3 font-bold transition hover:bg-black hover:text-white"
            >
              Everyone&apos;s Tired
            </Link>

            <Link
              href="/play/start"
              className="rounded bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-bold text-white shadow-lg transition-all hover:from-indigo-700 hover:to-purple-700"
            >
              🎮 Play TOW Game
            </Link>
          </div>
        </div>

        {/* TIRED COUNTER */}
        <div className="order-1 w-full lg:order-2 lg:sticky lg:top-6">
          <TiredCounter />
        </div>
      </div>
    </section>
  );
}