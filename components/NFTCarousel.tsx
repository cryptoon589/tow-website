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
  className="min-w-[160px] snap-start bg-white border border-black/10 rounded-lg overflow-hidden shadow-sm hover:scale-105 hover:shadow-md transition group cursor-pointer"
>
  <div className="relative overflow-hidden">
    <img
      src={nft.image}
      alt={nft.name}
      className="w-full h-[160px] object-cover transition duration-300 group-hover:scale-105"
    />

    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition duration-300 ease-out" />

    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
      <span className="text-white text-xs font-bold">
        still holding
      </span>
    </div>
  </div>

  <div className="p-2 text-xs text-center">{nft.name}</div>
</a>
        ))}
      </div>
    </div>
  );
}