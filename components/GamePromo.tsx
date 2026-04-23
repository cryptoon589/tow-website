"use client";

import TowCharacter from "@/components/game/TowCharacter";

export default function GamePromo() {
  return (
    <section className="w-full">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-16">
        <div className="grid items-center gap-8 md:grid-cols-2">

          {/* TEXT */}
          <div className="space-y-4 text-center md:text-left">
            <div className="inline-flex rounded-full border border-[#DDD7CE] bg-white px-3 py-1 text-xs font-medium text-[#6F685F]">
              Too Tired to Win
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-[#1E1B18] md:text-5xl">
              Click fast.
              <br />
              Regret faster.
            </h2>

            <p className="text-sm leading-6 text-[#6F685F] md:text-base">
              Pick the move. Watch the damage. Try not to get too tired.
            </p>
          </div>

          {/* CHARACTER */}
          <div className="flex justify-center md:justify-end">
            <TowCharacter
              state="idle-neutral"   // ✅ FIXED (string, not object)
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