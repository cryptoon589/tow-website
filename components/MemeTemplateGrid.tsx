"use client";

export default function MemeTemplateGrid({
  templates,
  selected,
  onSelect,
}: any) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {templates.map((t: any) => (
        <div
          key={t.id}
          onClick={() => onSelect(t)}
          className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-200
            ${
              selected?.id === t.id
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
  );
}