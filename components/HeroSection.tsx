import Link from "next/link";
import { siteConfig } from "@/config/site";
export default function HeroSection({ headline }: { headline?: string }) {
  const h = headline || siteConfig.heroHeadlines[0];
  return (
    <section className="py-16 md:py-12">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
        <div className="order-2 md:order-1">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">{h}</h1>
          <p className="text-lg text-gray-600 mb-8">{siteConfig.heroSubtext}</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/meme-generator" className="px-6 py-3 bg-black text-white font-bold rounded hover:bg-gray-800">Make a Meme</Link>
            <Link href="/tired-counter" className="px-6 py-3 border-2 border-black font-bold rounded hover:bg-black hover:text-white">Press Tired</Link>
            <Link href="/links" className="px-6 py-3 border-2 border-black font-bold rounded hover:bg-black hover:text-white">View Links</Link>
          </div>
        </div>
        <div className="order-1 md:order-2">
          <div className="aspect-square rounded-lg flex items-center justify-center overflow-hidden">
            <img src="/assets/characters/hero.png" alt="TOW" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
        </div>
      </div>
    </section>
  );
}