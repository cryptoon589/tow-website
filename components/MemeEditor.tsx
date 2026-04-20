"use client";

import { useEffect, useRef, useState } from "react";
import {
  memeCategories,
  MemeCategory,
  MemeTemplate,
} from "@/config/memeTemplates";

export default function MemeEditor() {
  const [category, setCategory] = useState<MemeCategory>(memeCategories[0]);
  const [template, setTemplate] = useState<MemeTemplate>(
    memeCategories[0].templates[0]
  );
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [size, setSize] = useState(48);
  const [upper, setUpper] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

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
        const txt = texts[f.id] || "";
        const display = upper ? txt.toUpperCase() : txt;

        ctx.font = `bold ${size}px Arial, sans-serif`;
        ctx.fillStyle = "white";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 4;
        ctx.textAlign = f.align || "center";
        ctx.textBaseline = "middle";

        ctx.strokeText(display, f.x, f.y);
        ctx.fillText(display, f.x, f.y);
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
  }, [template, texts, size, upper]);

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

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-bold text-lg mb-4">Choose Category</h3>
        <div className="flex flex-wrap gap-3">
          {memeCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => switchCategory(cat)}
              className={`px-4 py-2 border-2 rounded font-bold transition ${
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

      <div>
        <h3 className="font-bold text-lg mb-4">Choose Variation</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {category.templates.map((t) => (
            <button
              key={t.id}
              onClick={() => setTemplate(t)}
              className={`aspect-square border-2 rounded-lg overflow-hidden transition-all ${
                template.id === t.id
                  ? "border-black scale-[1.02] bg-gray-100"
                  : "border-gray-300 hover:border-black hover:scale-[1.02]"
              }`}
            >
              <img
                src={t.imagePath}
                alt={t.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div className="text-xs py-2 bg-white border-t border-gray-200">
                {t.name}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[420px_minmax(0,1fr)] gap-8 items-start">
        <div>
          <h3 className="font-bold text-lg mb-4">Preview</h3>
          <div className="bg-white border border-black/20 rounded-lg p-4 shadow-sm inline-block">
            <canvas
              ref={canvasRef}
              className="w-full h-auto max-w-[360px]"
              style={{ width: "100%", height: "auto" }}
            />
          </div>
        </div>

        <div>
          <h3 className="font-bold text-lg mb-4">Edit Text</h3>

          <div className="space-y-4 max-w-xl">
            <button onClick={randomizeText} className="text-sm underline">
              feeling tired? generate text
            </button>

            {template.textFields.map((f) => (
              <div key={f.id}>
                <label className="block text-sm font-medium mb-2">
                  {f.label}
                </label>
                <input
                  type="text"
                  value={texts[f.id] || ""}
                  onChange={(e) =>
                    setTexts((p) => ({ ...p, [f.id]: e.target.value }))
                  }
                  className="w-full px-4 py-2 border-2 border-black rounded"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium mb-2">
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
              className="px-8 py-4 border-2 border-black bg-white text-black font-bold rounded-lg hover:bg-black hover:text-white active:scale-95 transition"
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