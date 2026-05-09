"use client";

import { useRef } from "react";

const featuredMemes = [
  "/assets/memes/featured/meme-1.png",
  "/assets/memes/featured/meme-2.png",
  "/assets/memes/featured/meme-3.png",
  "/assets/memes/featured/meme-4.png",
  "/assets/memes/featured/meme-5.png",
  "/assets/memes/featured/meme-6.png",
];

export default function FeaturedMemes() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;

    scrollRef.current.scrollBy({
      left: dir === "left" ? -340 : 340,
      behavior: "smooth",
    });
  };

  return (
    <section className="bg-gray-50 py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 text-center">
          <h2 className="mb-3 text-3xl font-bold md:text-4xl">
            Featured Memes
          </h2>

          <p className="text-lg text-gray-600">
            Community favorites. Or just ones we liked.
          </p>
        </div>

        <div className="relative">
          {/* LEFT ARROW */}
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black px-4 py-3 text-2xl font-black text-white shadow-lg transition hover:scale-110"
          >
            ←
          </button>

          {/* RIGHT ARROW */}
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black px-4 py-3 text-2xl font-black text-white shadow-lg transition hover:scale-110"
          >
            →
          </button>

          {/* CAROUSEL */}
          <div
            ref={scrollRef}
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-12 pb-4"
          >
            {featuredMemes.map((src, index) => (
              <div
                key={src}
                className="min-w-[280px] snap-start overflow-hidden rounded-xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl md:min-w-[340px]"
              >
                <img
                  src={src}
                  alt={`Featured TOW meme ${index + 1}`}
                  className="h-auto w-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}