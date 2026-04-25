"use client";

import clsx from "clsx";

const STAMPS = [
  "EVENTUALLY REKT",
  "ALMOST MADE IT",
  "SO CLOSE",
  "NOT THIS TIME",
  "RUN IT BACK",
];

function getStamp() {
  return STAMPS[Math.floor(Math.random() * STAMPS.length)];
}

function getImage(result: string) {
  const r = result.toLowerCase();

  if (r.includes("hesitant")) return "/tow/run-id/hesitant.png";
  if (r.includes("degen")) return "/tow/run-id/degen.png";
  if (r.includes("participant")) return "/tow/run-id/participant.png";
  if (r.includes("exit")) return "/tow/run-id/rekt.png";

  return "/tow/run-id/survivor.png";
}

export default function GameOverOverlay({
  state,
  bestRun,
  profile,
  onReplay,
}: {
  state: any;
  bestRun: number;
  profile: any;
  onReplay: () => void;
}) {
  if (!state.gameOver) return null;

  const result = state.resultTitle || "The Participant";
  const stamp = getStamp();
  const img = getImage(result);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-[760px] rounded-2xl bg-[#F6F2EC] p-5 shadow-xl">

        {/* HEADER */}
        <div className="flex items-start justify-between mb-4">
          <div className="text-[11px] tracking-widest opacity-60">
            TOW RUN ID
            <div className="font-mono mt-1 text-[12px]">
              RUN-{String(state.turn).padStart(4, "0")}
            </div>
          </div>

          {/* 🔥 BIG STAMP */}
          <div
            className="text-[13px] font-bold text-red-600 px-4 py-2 border-2 border-red-400 rounded-full rotate-6"
            style={{
              boxShadow: "0 0 0 2px rgba(239,68,68,0.15)",
            }}
          >
            {stamp}
          </div>
        </div>

        {/* MAIN */}
        <div className="flex gap-5 items-center">

          {/* PORTRAIT */}
          <div className="w-[150px] h-[150px] rounded-xl overflow-hidden bg-[#EAE4DB] flex items-end justify-center">
            <img
              src={img}
              className="object-cover h-[120%] translate-y-3"
            />
          </div>

          {/* TEXT SIDE */}
          <div className="flex-1">
            <div className="text-4xl font-bold leading-tight mb-1">
              {result}
            </div>

            <div className="text-sm opacity-60 mb-4">
              You lasted {state.turn} turns.
            </div>

            {/* STATS */}
            <div className="grid grid-cols-4 gap-3 mb-3 text-sm">
              <div className="bg-[#EDE7DF] p-2 rounded-lg text-center">
                <div className="opacity-50 text-[10px]">TURNS</div>
                <div className="font-semibold">{state.turn}</div>
              </div>

              <div className="bg-[#EDE7DF] p-2 rounded-lg text-center">
                <div className="opacity-50 text-[10px]">TIRED</div>
                <div className="font-semibold">{state.tired}/100</div>
              </div>

              <div className="bg-[#EDE7DF] p-2 rounded-lg text-center">
                <div className="opacity-50 text-[10px]">HEATER</div>
                <div className="font-semibold">x{profile.bestStreak || 1}</div>
              </div>

              <div className="bg-[#EDE7DF] p-2 rounded-lg text-center">
                <div className="opacity-50 text-[10px]">SAVES</div>
                <div className="font-semibold">{profile.almostSaves || 0}</div>
              </div>
            </div>

            {/* MEMORY */}
            <div className="bg-[#EDE7DF] p-3 rounded-lg">
              <div className="text-[10px] opacity-50 mb-1">
                PLAYER MEMORY
              </div>

              <div className="font-medium">
                {profile.type || "balanced"}
              </div>

              <div className="text-xs opacity-60">
                {profile.description || "you kept going"}
              </div>
            </div>

            {/* QUOTE */}
            <div className="mt-3 text-sm opacity-60 italic">
              I almost made it. Next run might be the one.
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="mt-5 flex gap-3">
          <button
            onClick={onReplay}
            className="flex-1 bg-black text-white rounded-lg py-3 font-medium"
          >
            run it back
          </button>

          <button
            className="flex-1 border rounded-lg py-3"
            onClick={() => {
              const text = `${result} — ${state.turn} turns\nTired ${state.tired}/100`;
              navigator.clipboard.writeText(text);
            }}
          >
            copy result
          </button>

          <button
            className="flex-1 border rounded-lg py-3"
            onClick={() => {
              const text = `${result} — ${state.turn} turns\nTired ${state.tired}/100`;
              window.open(
                `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
              );
            }}
          >
            share to X
          </button>
        </div>
      </div>
    </div>
  );
}
