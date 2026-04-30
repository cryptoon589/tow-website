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
    <section className="pb-8 pt-2 md:pb-8 md:pt-4">
      <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 lg:grid-cols-[1fr_430px]">
        <div>
          <h1 className="mb-4 text-4xl font-bold leading-tight md:text-6xl">
            Still tired.
            <br />
            Still here.
          </h1>

          <p className="mb-6 text-lg text-gray-600 md:text-2xl">
            Tired now. Tired of winning later.
          </p>

          <div className="mb-6 aspect-square w-full max-w-[520px] overflow-hidden rounded-2xl bg-white">
            <img
              src={heroImages[index]}
              alt="TOW Character"
              className="h-full w-full object-contain transition-opacity duration-500"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/meme-generator"
              className="rounded bg-black px-6 py-3 font-bold text-white transition hover:bg-gray-800"
            >
              Make Memes
            </Link>

            <Link
              href="/tired-counter"
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

        <div className="w-full lg:sticky lg:top-6">
          <TiredCounter />
        </div>
      </div>
    </section>
  );
}