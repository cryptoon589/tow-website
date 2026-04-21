"use client";

import Image from "next/image";
import { TOW_STATE_IMAGES, TowState } from "@/lib/towStates";

type TowCharacterProps = {
  state: TowState;
  className?: string;
  priority?: boolean;
};

export default function TowCharacter({
  state,
  className = "",
  priority = false,
}: TowCharacterProps) {
  const src = TOW_STATE_IMAGES[state] ?? TOW_STATE_IMAGES.idle;

  return (
    <div className={`relative aspect-square w-full max-w-[380px] ${className}`}>
      <Image
        src={src}
        alt={`TOW character ${state}`}
        fill
        priority={priority}
        className="object-contain pointer-events-none select-none"
        sizes="(max-width: 768px) 80vw, 380px"
      />
    </div>
  );
}