"use client";

import { useEffect, useRef, useState } from "react";
import {
  memeCategories,
  MemeCategory,
  MemeTemplate,
} from "@/config/memeTemplates";

type TextPosition = "left" | "center" | "right";

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
) {
  const manualLines = text.split("\n");
  const lines: string[] = [];

  manualLines.forEach((manualLine) => {
    const words = manualLine.split(" ");
    let line = "";

    words.forEach((word) => {
      const testLine = line ? `${line} ${word}` : word;
      const width = ctx.measureText(testLine).width;

      if (width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    });

    lines.push(line);
  });

  return lines;
}

export default function MemeEditor() {
  const [category, setCategory] = useState<MemeCategory>(memeCategories[0]);
  const [template, setTemplate] = useState<MemeTemplate>(
    memeCategories[0].templates[0]
  );
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [size, setSize] = useState(48);
  const [upper, setUpper] = useState(true);
  const [textPosition, setTextPosition] = useState<TextPosition>("left");
  const [status, setStatus] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    ["when chart dips", "still holding"],
    ["everyone left", "still here"],
    ["no volume", "no problem"],
    ["this was the bottom", "again"],
    ["market destroyed me", "still posting"],
  ];

  useEffect(() => {
    const nextTexts: Record<string, string> = {};
    template.textFields.forEach((f) => {
      nextTexts[f.id] = f.defaultText;
    });
    setTexts(nextTexts);
  }, [template]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = template.imagePath;

    img.onload = () => {
      canvas.width = template.width;
      canvas.height = template.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      template.textFields.forEach((f) => {
        const rawText = texts[f.id] || "";
        const display = upper ? rawText.toUpperCase() : rawText;

        const padding = Math.max(28, canvas.width * 0.06);
        const maxWidth = Math.min(
          f.maxWidth || canvas.width * 0.82,
          canvas.width - padding * 2
        );

        const x =
          textPosition === "left"
            ? padding
            : textPosition === "right"
            ? canvas.width - padding
            : canvas.width / 2;

        ctx.font = `900 ${size}px Arial, sans-serif`;
        ctx.fillStyle = "#000000";
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = Math.max(4, size * 0.09);
        ctx.textAlign = textPosition;
        ctx.textBaseline = "middle";
        ctx.lineJoin = "round";

        const lines = wrapText(ctx, display, maxWidth);
        const lineHeight = size * 1.08;
        const startY = f.y - ((lines.length - 1) * lineHeight) / 2;

        lines.forEach((line, index) => {
          const y = startY + index * lineHeight;
          ctx.strokeText(line, x, y);
          ctx.fillText(line, x, y);
        });
      });
    };

    img.onerror = () => {
      canvas.width = template.width;
      canvas.height = template.height;
      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#6b7280";
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(template.name, canvas.width / 2, canvas.height / 2);
    };
  }, [template, texts, size, upper, textPosition]);

  const randomizeText = () => {
    const pick = suggestions[Math.floor(Math.random() * suggestions.length)];
    setTexts((prev) => ({
      ...prev,
      top: pick[0],
      bottom: pick[1],
    }));
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const a = document.createElement("a");
    a.download = `tow-meme-${Date.now()}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();

    setStatus("saved. post it.");
    setTimeout(() => setStatus(null), 2000);
  };

  const switchCategory = (cat: MemeCategory) => {
    setCategory(cat);
    setTemplate(cat.templates[0]);
  };

  const scrollCarousel = (direction: "left" | "right") => {
    carouselRef.current?.scrollBy({
      left: direction === "left" ? -240 : 240,
      behavior: "smooth",
    });
  };

  return (
    <div className="space-y-2">
      <div>
        <h3 className="mb-2 text-lg font-bold">Choose Category</h3>
        <div className="flex flex-wrap gap-3">
          {memeCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => switchCategory(cat)}
              className={`rounded border-2 px-4 py-2 font-bold transition ${
                category.id === cat.id
                  ? "border-black bg-black text-white"
                  : "border-gray-300 bg-white text-black hover:border-black"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="-mt-1">
        <h3 className="mb-2 text-lg font-bold">Choose Variation</h3>

        <div className="relative">
          <button
            type="button"
            onClick={() => scrollCarousel("left")}
            className="absolute left-1 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black px-3 py-2 text-xl font-black text-white shadow-xl transition hover:scale-110"
          >
            ←
          </button>

          <button
            type="button"
            onClick={() => scrollCarousel("right")}
            className="absolute right-1 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black px-3 py-2 text-xl font-black text-white shadow-xl transition hover:scale-110"
          >
            →
          </button>

          <div
            ref={carouselRef}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-10 pb-2"
          >
            {category.templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplate(t)}
                className={`min-w-[160px] snap-start overflow-hidden rounded-lg border-2 bg-white transition-all md:min-w-[190px] ${
                  template.id === t.id
                    ? "border-black bg-gray-100"
                    : "border-gray-300 hover:border-black"
                }`}
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={t.imagePath}
                    alt={t.name}
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>

                <div className="border-t border-gray-200 bg-white py-1 text-xs font-bold">
                  {t.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid items-start gap-8 pt-3 lg:grid-cols-[420px_minmax(0,1fr)]">
        <div>
          <h3 className="mb-2 text-lg font-bold">Preview</h3>
          <div className="inline-block rounded-lg border border-black/20 bg-white p-4 shadow-sm">
            <canvas
              ref={canvasRef}
              className="h-auto w-full max-w-[360px]"
              style={{ width: "100%", height: "auto" }}
            />
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-bold">Edit Text</h3>

          <div className="max-w-xl space-y-4">
            <button onClick={randomizeText} className="text-sm underline">
              feeling tired? generate text
            </button>

            {template.textFields.map((f) => (
              <div key={f.id}>
                <label className="mb-2 block text-sm font-medium">
                  {f.label}
                </label>
                <textarea
                  value={texts[f.id] || ""}
                  onChange={(e) =>
                    setTexts((p) => ({ ...p, [f.id]: e.target.value }))
                  }
                  rows={2}
                  className="w-full resize-y rounded border-2 border-black px-4 py-2"
                />
              </div>
            ))}

            <div>
              <label className="mb-2 block text-sm font-medium">
                Text Position
              </label>

              <div className="grid grid-cols-3 gap-2">
                {(["left", "center", "right"] as TextPosition[]).map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setTextPosition(pos)}
                    className={`rounded border-2 px-4 py-2 text-sm font-bold capitalize transition ${
                      textPosition === pos
                        ? "border-black bg-black text-white"
                        : "border-black bg-white text-black hover:bg-black hover:text-white"
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Size: {size}px
              </label>
              <input
                type="range"
                min="24"
                max="72"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="up"
                checked={upper}
                onChange={(e) => setUpper(e.target.checked)}
              />
              <label htmlFor="up">UPPERCASE</label>
            </div>

            <button
              onClick={download}
              className="rounded-lg border-2 border-black bg-white px-8 py-4 font-bold text-black transition hover:bg-black hover:text-white active:scale-95"
            >
              Download Meme
            </button>

            {status && <p className="text-sm text-gray-500">{status}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}