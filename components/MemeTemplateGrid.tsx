import Link from "next/link";
import { memeCategories } from "@/config/memeTemplates";

export default function MemeTemplateGrid() {
  const previewTemplates = memeCategories.flatMap((cat) => cat.templates).slice(0, 4);

  return (
    <section className="py-10 md:py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Meme Generator</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Make something tired. Export it. Post it.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {previewTemplates.map((t) => (
            <div
              key={t.id}
              className="aspect-square bg-white border border-black/20 rounded-lg overflow-hidden shadow-sm"
            >
              <img
                src={t.imagePath}
                alt={t.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/meme-generator"
            className="inline-block px-8 py-4 border-2 border-black bg-white text-black font-bold rounded-lg hover:bg-black hover:text-white transition"
          >
            Open Meme Generator
          </Link>
        </div>
      </div>
    </section>
  );
}