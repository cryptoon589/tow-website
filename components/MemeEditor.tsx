"use client";

import { useState } from "react";

export default function MemeEditor({ templates }: any) {
  const [selected, setSelected] = useState(templates[0]);
  const [topText, setTopText] = useState("TOP TEXT");
  const [bottomText, setBottomText] = useState("BOTTOM TEXT");
  const [size, setSize] = useState(48);
  const [resp, setResp] = useState<string | null>(null);

  const suggestions = [
    ["when chart dips", "still holding"],
    ["everyone left", "still here"],
    ["no volume", "no problem"],
    ["this was the bottom", "again"],
  ];

  const randomizeText = () => {
    const pick = suggestions[Math.floor(Math.random() * suggestions.length)];
    setTopText(pick[0]);
    setBottomText(pick[1]);
  };

  const download = () => {
    // keep your existing download logic
    setResp("saved. post it.");
    setTimeout(() => setResp(null), 2000);
  };

  return (
    <div className="space-y-8">

      {/* TEMPLATE GRID */}
      <div>
        <h3 className="font-bold mb-4">Choose Template</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {templates.map((t: any) => (
            <div
              key={t.id}
              onClick={() => setSelected(t)}
              className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-200
                ${
                  selected.id === t.id
                    ? "border-black scale-105 bg-gray-100"
                    : "border-gray-300 hover:border-black hover:scale-105"
                }`}
            >
              <div className="aspect-square bg-gray-100 rounded flex items-center justify-center text-sm text-gray-500">
                {t.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PREVIEW */}
      <div>
        <h3 className="font-bold mb-4">Preview</h3>

        <div className="max-w-2xl border border-black/20 bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="aspect-square flex flex-col justify-between p-6 text-center">

            <p
              className="font-bold animate-fade-in"
              style={{ fontSize: size }}
            >
              {topText}
            </p>

            <p
              className="font-bold animate-fade-in"
              style={{ fontSize: size }}
            >
              {bottomText}
            </p>

          </div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="space-y-6 max-w-2xl">

        <div>
          <button
            onClick={randomizeText}
            className="text-sm underline mb-3"
          >
            feeling tired? generate text
          </button>

          <label className="block text-sm mb-1">Top Text</label>
          <input
            value={topText}
            onChange={(e) => setTopText(e.target.value)}
            className="w-full border-2 border-black rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Bottom Text</label>
          <input
            value={bottomText}
            onChange={(e) => setBottomText(e.target.value)}
            className="w-full border-2 border-black rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Size: {size}px</label>
          <input
            type="range"
            min={20}
            max={80}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <button
          onClick={download}
          className="px-8 py-4 border-2 border-black bg-white text-black font-bold rounded hover:bg-black hover:text-white active:scale-95 transition"
        >
          Download Meme
        </button>

        {resp && (
          <p className="text-sm text-gray-500">{resp}</p>
        )}
      </div>
    </div>
  );
}