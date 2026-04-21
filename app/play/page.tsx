"use client";

import { useEffect, useRef, useState } from "react";
import TowCharacter from "@/components/game/TowCharacter";
import type { TowState } from "@/lib/towStates";

export default function PlayPage() {
  const [towState, setTowState] = useState<TowState>("idle");
  const stateTimeouts = useRef<number[]>([]);

  function clearTowStateTimeouts() {
    stateTimeouts.current.forEach((id) => window.clearTimeout(id));
    stateTimeouts.current = [];
  }

  function queueTowState(state: TowState, delay: number) {
    const id = window.setTimeout(() => setTowState(state), delay);
    stateTimeouts.current.push(id);
  }

  async function handlePlay() {
    clearTowStateTimeouts();
    setTowState("preAction");
    queueTowState("tap", 120);

    const roll = Math.random();

    if (roll > 0.9) queueTowState("glitch", 260);
    else if (roll > 0.75) queueTowState("win", 260);
    else if (roll > 0.5) queueTowState("lose", 260);
    else if (roll > 0.25) queueTowState("rekt", 260);
    else queueTowState("tired", 260);

    queueTowState("idle", 1400);
  }

  useEffect(() => {
    return () => clearTowStateTimeouts();
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <TowCharacter state={towState} priority />

      <button
        onClick={handlePlay}
        className="rounded-xl border border-black px-6 py-3 text-lg"
      >
        Play
      </button>
    </main>
  );
}