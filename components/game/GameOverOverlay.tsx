"use client";

import { useMemo, useRef, useState } from "react";

const STAMPS = [
  "EVENTUALLY REKT",
  "ALMOST MADE IT",
  "SO CLOSE",
  "NOT THIS TIME",
  "RUN IT BACK",
  "ONE MORE RUN",
  "SURVIVED NOTHING",
];

function pickStamp(turn: number, result: string) {
  const seed = `${result}-${turn}`;
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 9973;
  }

  return STAMPS[hash % STAMPS.length];
}

function getImage(result: string) {
  const r = result.toLowerCase();

  if (r.includes("hesitant")) return "/tow/run-id/hesitant.png";
  if (r.includes("degen")) return "/tow/run-id/degen.png";
  if (r.includes("participant")) return "/tow/run-id/participant.png";
  if (r.includes("exit")) return "/tow/run-id/rekt.png";
  if (r.includes("rekt")) return "/tow/run-id/rekt.png";

  return "/tow/run-id/survivor.png";
}

function getResultColor(result: string) {
  const r = result.toLowerCase();

  if (r.includes("exit") || r.includes("rekt")) return "text-red-600";
  if (r.includes("degen")) return "text-orange-500";
  if (r.includes("hesitant")) return "text-purple-600";

  return "text-[#1F1C18]";
}

function getCanvasResultColor(result: string) {
  const r = result.toLowerCase();

  if (r.includes("exit") || r.includes("rekt")) return "#DC2626";
  if (r.includes("degen")) return "#F97316";
  if (r.includes("hesitant")) return "#9333EA";

  return "#1F1C18";
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options?: {
    font?: string;
    fillStyle?: string;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
  }
) {
  ctx.save();
  ctx.font = options?.font ?? "24px Arial, sans-serif";
  ctx.fillStyle = options?.fillStyle ?? "#1F1C18";
  ctx.textAlign = options?.align ?? "left";
  ctx.textBaseline = options?.baseline ?? "alphabetic";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawCenteredStampText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontFamily: string
) {
  let size = 36;

  while (size > 24) {
    ctx.font = `900 ${size}px ${fontFamily}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }

  drawText(ctx, text, x, y, {
    font: `900 ${size}px ${fontFamily}`,
    fillStyle: "#E11919",
    align: "center",
    baseline: "middle",
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

async function createCardPng({
  state,
  profile,
  result,
  img,
  stamp,
}: {
  state: any;
  profile: any;
  result: string;
  img: string;
  stamp: string;
}) {
  await document.fonts.ready;

  const computedFont = getComputedStyle(document.body).fontFamily;
  const fontFamily = computedFont || "Inter, Arial, sans-serif";
  const serifFamily = "Georgia, 'Times New Roman', serif";
  const monoFamily = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";

  const canvas = document.createElement("canvas");

  // Match the live card proportions instead of exporting a huge different card.
  const width = 1100;
  const height = 560;
  const scale = 2;

  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Background.
  ctx.fillStyle = "#F6F2EC";
  ctx.fillRect(0, 0, width, height);

  // Subtle grid.
  ctx.strokeStyle = "rgba(0,0,0,0.045)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += 12) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(0,0,0,0.025)";
  for (let y = 0; y <= height; y += 12) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Border.
  ctx.strokeStyle = "#DDD3C8";
  ctx.lineWidth = 1.5;
  roundedRect(ctx, 1, 1, width - 2, height - 2, 22);
  ctx.stroke();

  // Run ID.
  drawText(ctx, "TOW RUN ID", 28, 42, {
    font: `700 16px ${serifFamily}`,
    fillStyle: "#837A70",
  });
  drawText(ctx, `RUN-${String(state.turn).padStart(4, "0")}`, 28, 70, {
    font: `500 14px ${monoFamily}`,
    fillStyle: "#1F1C18",
  });

  // Stamp — one-line, dominant, red, export-safe.
  ctx.save();
  ctx.translate(725, 45);
  ctx.rotate((3 * Math.PI) / 180);

  ctx.shadowColor = "rgba(225,25,25,0.22)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;

  ctx.fillStyle = "#FFF1F1";
  ctx.strokeStyle = "#E11919";
  ctx.lineWidth = 5;
  roundedRect(ctx, 0, 0, 340, 70, 35);
  ctx.fill();
  ctx.stroke();

  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "rgba(225,25,25,0.16)";
  ctx.lineWidth = 8;
  roundedRect(ctx, -5, -5, 350, 80, 40);
  ctx.stroke();

  drawCenteredStampText(ctx, stamp, 170, 36, 286, fontFamily);
  ctx.restore();

  // Portrait panel.
  const portraitX = 28;
  const portraitY = 145;
  const portraitW = 300;
  const portraitH = 320;

  roundedRect(ctx, portraitX, portraitY, portraitW, portraitH, 18);
  ctx.fillStyle = "#EDE7DF";
  ctx.fill();
  ctx.strokeStyle = "#DED5CA";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  drawText(ctx, "PORTRAIT", portraitX + 18, portraitY + 30, {
    font: `700 15px ${serifFamily}`,
    fillStyle: "#9A9288",
  });

  const portrait = await loadImage(img);
  if (portrait) {
    ctx.save();
    roundedRect(ctx, portraitX, portraitY, portraitW, portraitH, 18);
    ctx.clip();

    // Same visual feel as live <img className="h-[145%] bottom-[-18px]" />.
    const targetH = portraitH * 1.45;
    const targetW = targetH * (portrait.width / portrait.height);
    const targetX = portraitX + portraitW / 2 - targetW / 2;
    const targetY = portraitY + portraitH - targetH - 18;
    ctx.drawImage(portrait, targetX, targetY, targetW, targetH);
    ctx.restore();
  }

  // Main result.
  const contentX = 360;
  drawText(ctx, result, contentX, 215, {
    font: `900 56px ${fontFamily}`,
    fillStyle: getCanvasResultColor(result),
  });

  // You lasted line, with measured spacing so it does not look broken.
  const lineY = 255;
  ctx.font = `500 20px ${fontFamily}`;
  ctx.fillStyle = "#6E655C";
  ctx.fillText("You lasted ", contentX, lineY);
  const lastedWidth = ctx.measureText("You lasted ").width;

  ctx.font = `800 20px ${fontFamily}`;
  ctx.fillStyle = "#F97316";
  ctx.fillText(String(state.turn), contentX + lastedWidth, lineY);
  const turnWidth = ctx.measureText(String(state.turn)).width;

  ctx.font = `500 20px ${fontFamily}`;
  ctx.fillStyle = "#6E655C";
  ctx.fillText(" turns.", contentX + lastedWidth + turnWidth, lineY);

  // Stat boxes match live card order: turns, tired, heater, saves.
  const statY = 285;
  const statW = 125;
  const statH = 74;
  const statGap = 18;
  const stats = [
    { label: "TURNS", value: state.turn, color: "#F97316" },
    { label: "TIRED", value: `${state.tired}/100`, color: "#DC2626" },
    { label: "HEATER", value: `x${profile?.bestStreak || 1}`, color: "#16A34A" },
    { label: "SAVES", value: profile?.almostSaves || 0, color: "#9333EA" },
  ];

  stats.forEach((stat, index) => {
    const x = contentX + index * (statW + statGap);
    roundedRect(ctx, x, statY, statW, statH, 12);
    ctx.fillStyle = "#EDE7DF";
    ctx.fill();
    drawText(ctx, stat.label, x + statW / 2, statY + 24, {
      font: `600 11px ${fontFamily}`,
      fillStyle: "#91887E",
      align: "center",
    });
    drawText(ctx, String(stat.value), x + statW / 2, statY + 53, {
      font: `900 22px ${fontFamily}`,
      fillStyle: stat.color,
      align: "center",
    });
  });

  // Player memory.
  roundedRect(ctx, contentX, 378, 690, 86, 12);
  ctx.fillStyle = "#EDE7DF";
  ctx.fill();

  drawText(ctx, "PLAYER MEMORY", contentX + 18, 408, {
    font: `700 13px ${serifFamily}`,
    fillStyle: "#91887E",
  });
  drawText(ctx, profile?.type || "balanced", contentX + 18, 438, {
    font: `900 20px ${fontFamily}`,
    fillStyle: "#1F1C18",
  });
  drawText(ctx, profile?.description || "you kept going", contentX + 18, 462, {
    font: `500 18px ${fontFamily}`,
    fillStyle: "#6E655C",
  });

  drawText(ctx, "I almost made it. Next run might be the one.", contentX, 505, {
    font: `italic 21px ${serifFamily}`,
    fillStyle: "#746A60",
  });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("Canvas PNG failed"));
      else resolve(blob);
    }, "image/png");
  });
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
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const result = state?.resultTitle || "The Participant";
  const img = getImage(result);
  const stamp = useMemo(
    () => pickStamp(state?.turn || 0, result),
    [state?.turn, result]
  );
  const resultColor = getResultColor(result);

  if (!state?.gameOver) return null;

  const downloadCard = async () => {
    if (isDownloading) return;

    setIsDownloading(true);

    try {
      const blob = await createCardPng({
        state,
        profile,
        result,
        img,
        stamp,
      });

      downloadBlob(blob, `tow-run-${String(state.turn).padStart(4, "0")}.png`);
    } catch (error) {
      console.error("TOW card download failed:", error);
      alert("Could not download the card PNG. Try again or take a screenshot.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/55 p-3 backdrop-blur-sm sm:p-4">
      <div className="w-full max-w-[860px] rounded-[24px] bg-[#F6F2EC] p-3 shadow-2xl sm:rounded-[30px] sm:p-4">
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-[22px] border border-[#DDD3C8] bg-[#F6F2EC] p-4 sm:p-5"
        >
          <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(90deg,rgba(0,0,0,0.045)_1px,transparent_1px),linear-gradient(rgba(0,0,0,0.025)_1px,transparent_1px)] [background-size:12px_12px]" />

          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="min-w-0 shrink-0 whitespace-nowrap text-[9px] tracking-[0.2em] text-[#837A70] sm:text-[11px] sm:tracking-[0.22em]">
              TOW RUN ID
              <div className="mt-1 whitespace-nowrap font-mono text-[10px] tracking-[0.1em] text-[#1F1C18] sm:text-[12px] sm:tracking-[0.12em]">
                RUN-{String(state.turn).padStart(4, "0")}
              </div>
            </div>

            <div
              className="shrink-0 rotate-[3deg] rounded-full border-[4px] border-[#E11919] bg-[#FFF1F1] px-4 py-2 text-[#E11919] sm:border-[5px] sm:px-8 sm:py-3"
              style={{
                boxShadow:
                  "0 0 0 5px rgba(225,25,25,0.16), 0 14px 30px rgba(225,25,25,0.22)",
              }}
            >
              <div className="whitespace-nowrap text-center text-[14px] font-black uppercase leading-none tracking-[0.04em] text-[#E11919] sm:text-[28px] sm:tracking-[0.06em]">
                {stamp}
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-4 grid grid-cols-[34%_1fr] gap-3 sm:mt-6 sm:grid-cols-[230px_1fr] sm:gap-6">
            <div className="relative h-[210px] overflow-hidden rounded-[18px] border border-[#DED5CA] bg-[#EDE7DF] shadow-inner sm:h-[280px]">
              <div className="absolute left-3 top-3 z-10 text-[9px] font-bold tracking-[0.22em] text-[#9A9288] sm:text-[10px]">
                PORTRAIT
              </div>

              <img
                src={img}
                alt={result}
                className="absolute bottom-[-18px] left-1/2 h-[145%] -translate-x-1/2 object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </div>

            <div className="min-w-0 pt-2 sm:pt-4">
              <div
                className={`mb-1 text-2xl font-black leading-none sm:text-5xl ${resultColor}`}
              >
                {result}
              </div>

              <div className="mb-3 text-xs font-medium text-[#6E655C] sm:mb-4 sm:text-sm">
                You lasted{" "}
                <span className="font-bold text-orange-500">{state.turn}</span>{" "}
                turns.
              </div>

              <div className="mb-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 sm:gap-3 sm:text-sm">
                <div className="rounded-xl bg-[#EDE7DF] p-2 text-center sm:p-3">
                  <div className="text-[9px] tracking-wider text-[#91887E] sm:text-[10px]">
                    TURNS
                  </div>
                  <div className="text-base font-black text-orange-500 sm:text-lg">
                    {state.turn}
                  </div>
                </div>

                <div className="rounded-xl bg-[#EDE7DF] p-2 text-center sm:p-3">
                  <div className="text-[9px] tracking-wider text-[#91887E] sm:text-[10px]">
                    TIRED
                  </div>
                  <div className="text-base font-black text-red-600 sm:text-lg">
                    {state.tired}/100
                  </div>
                </div>

                <div className="rounded-xl bg-[#EDE7DF] p-2 text-center sm:p-3">
                  <div className="text-[9px] tracking-wider text-[#91887E] sm:text-[10px]">
                    HEATER
                  </div>
                  <div className="text-base font-black text-green-600 sm:text-lg">
                    x{profile?.bestStreak || 1}
                  </div>
                </div>

                <div className="rounded-xl bg-[#EDE7DF] p-2 text-center sm:p-3">
                  <div className="text-[9px] tracking-wider text-[#91887E] sm:text-[10px]">
                    SAVES
                  </div>
                  <div className="text-base font-black text-purple-600 sm:text-lg">
                    {profile?.almostSaves || 0}
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-[#EDE7DF] p-2 sm:p-3">
                <div className="mb-1 text-[9px] font-bold tracking-[0.18em] text-[#91887E] sm:text-[10px] sm:tracking-[0.2em]">
                  PLAYER MEMORY
                </div>
                <div className="text-sm font-bold text-[#1F1C18] sm:text-base">
                  {profile?.type || "balanced"}
                </div>
                <div className="text-xs text-[#6E655C] sm:text-sm">
                  {profile?.description || "you kept going"}
                </div>
              </div>

              <div className="mt-2 text-xs italic text-[#746A60] sm:mt-3 sm:text-base">
                I almost made it. Next run might be the one.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3" data-no-export="true">
          <button
            onClick={onReplay}
            className="relative min-h-[58px] overflow-hidden rounded-[22px] border border-white/70 px-4 py-4 text-[15px] font-black text-zinc-900 shadow-[0_12px_30px_rgba(0,0,0,0.16)] backdrop-blur-md transition-all duration-300 ease-out hover:scale-[1.04] hover:shadow-[0_18px_42px_rgba(0,0,0,0.22)] active:scale-[0.97] sm:min-h-[68px] sm:rounded-[26px] sm:px-8 sm:py-5 sm:text-[19px]"
            style={{
              background:
                "linear-gradient(135deg, rgba(182,230,204,0.85), rgba(255,192,192,0.85))",
            }}
          >
            run it back
          </button>

          <button
            onClick={downloadCard}
            disabled={isDownloading}
            className="min-h-[58px] rounded-[22px] border border-[#D8D2C8] bg-black px-4 py-4 text-[13px] font-black text-white transition-all duration-200 ease-out hover:scale-[1.03] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[68px] sm:rounded-[26px] sm:px-8 sm:py-5 sm:text-[17px]"
          >
            {isDownloading ? "preparing PNG..." : "download card PNG to share"}
          </button>
        </div>
      </div>
    </div>
  );
}
