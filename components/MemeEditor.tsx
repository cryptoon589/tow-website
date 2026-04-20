"use client";

import { useState } from "react";
import { memeCategories } from "@/config/memeTemplates";

export default function MemeEditor() {
  const [category, setCategory] = useState(memeCategories[0]);
  const [selected, setSelected] = useState(category.templates[0]);

  const [topText, setTopText] = useState("TOP TEXT");
  const [bottomText, setBottomText] = useState("BOTTOM TEXT");
  const [size, setSize] = useState(40);

  const suggestions = [
    ["when chart dips", "still holding"],
    ["everyone left", "still here"],
    ["no volume", "no problem"],
    ["this was the bottom", "again"],
  ];

  const randomize = () => {
    const pick = suggestions[Math.floor(Math.random() * suggestions.length)];
    setTopText(pick[0]);
    setBottomText(pick[1]);
  };

  return (
    <div className="space-y-10">

      {/* CATEGORY SELECTOR */}
      <div className="flex gap-3 flex-wrap">
        {memeCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setCategory(cat);
              setSelected(cat.templates[0]);
            }}
            className={`px-4 py-2 border-2 rounded font-bold transition
              ${
                category.id === cat.id
                  ? "border-black bg-black text-white"
                  : "border-gray-300 hover:border-black"
              }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* VARIATIONS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {category.templates.map((t) => (
          <div
            key={t.id}
            onClick={() => setSelected(t)}
            className={`p-2 border-2 rounded-lg cursor-pointer transition
              ${
                selected.id === t.id
                  ? "border-black scale-105"
                  : "border-gray-300 hover:border-black hover:scale-105"
              }`}
          >
            <div className="aspect-square bg-gray-100 flex items-center justify-center text-xs">
              {t.label}
            </div>
          </div>
        ))}
      </div>

      {/* MAIN EDITOR */}
      <div className="grid md:grid-cols-2 gap-8 items-start">

        {/* PREVIEW */}
        <div className="border border-black/20 bg-white shadow-sm rounded-lg overflow-hidden max-w-md">
          <div className="aspect-square flex flex-col justify-between p-4 text-center">

            <p style={{ fontSize: size }} className="font-bold">
              {topText}
            </p>

            <img
              src={selected.image}
              alt=""
              className="max-h-[60%] mx-auto"
            />

            <p style={{ fontSize: size }} className="font-bold">
              {bottomText}
            </p>

          </div>
        </div>

        {/* CONTROLS */}
        <div className="space-y-6">

          <button onClick={randomize} className="text-sm underline">
            feeling tired? generate text
          </button>

          <div>
            <label className="text-sm">Top Text</label>
            <input
              value={topText}
              onChange={(e) => setTopText(e.target.value)}
              className="w-full border-2 border-black px-3 py-2 rounded"
            />
          </div>

          <div>
            <label className="text-sm">Bottom Text</label>
            <input
              value={bottomText}
              onChange={(e) => setBottomText(e.target.value)}
              className="w-full border-2 border-black px-3 py-2 rounded"
            />
          </div>

          <div>
            <label className="text-sm">Size: {size}px</label>
            <input
              type="range"
              min={20}
              max={80}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <button className="px-8 py-4 border-2 border-black bg-white font-bold rounded hover:bg-black hover:text-white active:scale-95 transition">
            Download Meme
          </button>

        </div>
      </div>
    </div>
  );
}