"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TowCharacter from "@/components/game/TowCharacter";

const idleStates = [
  "idle-neutral",
  "idle-phone-check",
  "base-lean-phone-choose",
  "idle-neutral",
  "idle-phone-check",
  "base-lean-phone-choose",
];

export default function GamePromo() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % idleStates.length);
    }, 1300);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="w-full">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-16">
        <div className="grid items-center gap-8 md:grid-cols-2">

          <div className="space-y-5 text-center md:text-left">
            <div className="inline-flex rounded-full border border-[#DDD7CE] bg-white px-3 py-1 text-xs font-medium text-[#6F685F]">
              Too Tired to Win
            </div>

            <h2 className="text-3xl font-bold leading-[1.18] md:text-5xl">
              Click fast.
              <br />
              Regret faster.
            </h2>

            <p className="text-sm text-[#6F685F] md:text-base">
              Pick the move. Watch the damage. Try not to get too tired.
            </p>

            <Link
              href="/play/start"
              className="inline-flex rounded bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-bold text-white shadow-lg"
            >
              🎮 Play TOW Game
            </Link>
          </div>

          <div className="flex justify-center md:justify-end">
            <TowCharacter
              state={idleStates[index]}
              timeLeftMs={5500}
              choiceWindowMs={5500}
              width={360}
              height={360}
            />
          </div>

        </div>
      </div>
    </section>
  );
}