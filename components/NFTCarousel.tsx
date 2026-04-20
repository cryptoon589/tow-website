"use client";

import { useMemo } from "react";
import { nfts } from "@/config/nfts";

export default function NFTCarousel() {
  const shuffled = useMemo(() => {
    return [...nfts].sort(() => Math.random() - 0.5);
  }, []);

  return (
    <div className="mt-12">
      <h3 className="text-2xl font-bold mb-6">Some are more tired than others.</h3>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {shuffled.map((nft) => (
          <a
            key={nft.id}
            href={nft.url}
            target="_blank"
            className="min-w-[160px] bg-white border border-black/20 rounded-lg overflow-hidden shadow-sm hover:scale-105 transition"
          >
            <img
              src={nft.image}
              alt={nft.name}
              className="w-full h-[160px] object-cover"
            />
            <div className="p-2 text-xs text-center">{nft.name}</div>
          </a>
        ))}
      </div>
    </div>
  );
}