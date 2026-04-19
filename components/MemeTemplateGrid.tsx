import Link from "next/link";
import { memeTemplates } from "@/config/memeTemplates";
export default function MemeTemplateGrid() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-bold mb-4">Meme Generator</h2><p className="text-lg text-gray-600 max-w-2xl mx-auto">Create your own TOW memes. Choose a template, add text, export. Simple.</p></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {memeTemplates.slice(0, 4).map((t) => (<div key={t.id} className="aspect-square bg-gray-50 border-2 border-black rounded-lg overflow-hidden"><img src={t.imagePath} alt={t.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} /></div>))}
        </div>
        <div className="text-center"><Link href="/meme-generator" className="inline-block px-8 py-4 bg-black text-white font-bold rounded-lg hover:bg-gray-800">Open Meme Generator</Link></div>
      </div>
    </section>
  );
}