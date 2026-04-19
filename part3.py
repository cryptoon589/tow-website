import os
os.chdir(r'C:\Users\ahmad\Downloads\tow-website')

files = {}

# Header.tsx
files['components/Header.tsx'] = '''"use client";
import Link from "next/link";
import { useState } from "react";
import { navItems } from "@/config/site";
export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-black">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center"><span className="text-white font-bold text-lg">TOW</span></div>
          <span className="font-bold text-xl hidden sm:block">Tired Of Winning</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (<Link key={item.href} href={item.href} className="text-sm font-medium hover:text-gray-600">{item.label}</Link>))}
        </nav>
        <button onClick={() => setOpen(!open)} className="md:hidden p-2">
          <div className="w-6 h-5 flex flex-col justify-between">
            <span className={`block h-0.5 bg-black transition-transform ${open ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block h-0.5 bg-black transition-opacity ${open ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 bg-black transition-transform ${open ? "-rotate-45 -translate-y-2" : ""}`} />
          </div>
        </button>
      </div>
      {open && (<nav className="md:hidden mt-4 pb-4 border-t border-black pt-4">{navItems.map((item) => (<Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="block py-2 text-sm font-medium">{item.label}</Link>))}</nav>)}
    </header>
  );
}'''

# Footer.tsx
files['components/Footer.tsx'] = '''import Link from "next/link";
import { officialLinks } from "@/config/site";
export default function Footer() {
  return (
    <footer className="border-t border-black bg-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center"><span className="text-white font-bold text-lg">TOW</span></div>
              <span className="font-bold text-xl">Tired Of Winning</span>
            </div>
            <p className="text-sm text-gray-600">Too tired to quit. Still here.</p>
          </div>
          <div>
            <h3 className="font-bold mb-4">Official Links</h3>
            <div className="grid grid-cols-2 gap-2">
              {officialLinks.map((link) => (<Link key={link.label} href={link.url} target={link.url.startsWith("http") ? "_blank" : undefined} rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined} className="text-sm hover:text-gray-600">{link.label}</Link>))}
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-black text-center text-sm text-gray-600"><p>&copy; {new Date().getFullYear()} TOW. All rights reserved.</p></div>
      </div>
    </footer>
  );
}'''

# HeroSection.tsx
files['components/HeroSection.tsx'] = '''import Link from "next/link";
import { siteConfig } from "@/config/site";
export default function HeroSection({ headline }: { headline?: string }) {
  const h = headline || siteConfig.heroHeadlines[0];
  return (
    <section className="py-16 md:py-24">
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
          <div className="aspect-square bg-gray-50 border-2 border-black rounded-lg flex items-center justify-center overflow-hidden">
            <img src="/assets/characters/hero.png" alt="TOW" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
        </div>
      </div>
    </section>
  );
}'''

# TiredCounter.tsx
files['components/TiredCounter.tsx'] = '''"use client";
import { useState, useEffect } from "react";
import { tiredResponses } from "@/config/site";
export default function TiredCounter({ initialCount = 0 }: { initialCount?: number }) {
  const [count, setCount] = useState(initialCount);
  const [resp, setResp] = useState<string | null>(null);
  const [anim, setAnim] = useState(false);
  useEffect(() => { const s = localStorage.getItem("tow-tired-count"); if (s) setCount(parseInt(s, 10)); }, []);
  const click = () => {
    const n = count + 1; setCount(n); localStorage.setItem("tow-tired-count", n.toString());
    setResp(tiredResponses[Math.floor(Math.random() * tiredResponses.length)]);
    setAnim(true); setTimeout(() => setAnim(false), 300); setTimeout(() => setResp(null), 3000);
  };
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-8">Global Tired Count</h2>
        <div className="mb-8"><div className={`text-7xl md:text-9xl font-bold transition-transform ${anim ? "scale-110" : "scale-100"}`}>{count.toLocaleString()}</div><p className="text-gray-600 mt-4">souls too tired to quit</p></div>
        <button onClick={click} className="px-12 py-6 bg-black text-white text-2xl font-bold rounded-lg hover:bg-gray-800 active:scale-95 transition-all shadow-lg">TIRED</button>
        {resp && <p className="mt-6 text-lg text-gray-600 animate-fade-in">{resp}</p>}
        <div className="mt-12 max-w-2xl mx-auto"><p className="text-sm text-gray-500">Press the button when you are tired. The count goes up. That is it.</p></div>
      </div>
    </section>
  );
}'''

# MemeTemplateGrid.tsx
files['components/MemeTemplateGrid.tsx'] = '''import Link from "next/link";
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
}'''

# OfficialLinks.tsx
files['components/OfficialLinks.tsx'] = '''import Link from "next/link";
import { officialLinks } from "@/config/site";
export default function OfficialLinks() {
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-bold mb-4">Official Links</h2><p className="text-lg text-gray-600">Everything you need. All in one place.</p></div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {officialLinks.map((link) => (<Link key={link.label} href={link.url} target={link.url.startsWith("http") ? "_blank" : undefined} rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined} className="block p-6 bg-white border-2 border-black rounded-lg hover:bg-black hover:text-white transition-colors group"><h3 className="font-bold text-lg mb-2">{link.label}</h3><p className="text-sm text-gray-600 group-hover:text-gray-300">{link.description}</p></Link>))}
        </div>
      </div>
    </section>
  );
}'''

# NftHighlight.tsx
files['components/NftHighlight.tsx'] = '''import Link from "next/link";
export default function NftHighlight() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
        <div className="aspect-square bg-gray-50 border-2 border-black rounded-lg overflow-hidden"><img src="/assets/nft/preview.png" alt="NFT" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} /></div>
        <div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">NFT Collection</h2>
          <p className="text-lg text-gray-600 mb-8">The official TOW NFT collection. Doodle-style characters living their best tired lives on the XRPL.</p>
          <Link href="/nft-collection" className="inline-block px-8 py-4 bg-black text-white font-bold rounded-lg hover:bg-gray-800">View NFT Collection</Link>
        </div>
      </div>
    </section>
  );
}'''

# FeaturedMemes.tsx
files['components/FeaturedMemes.tsx'] = '''import { featuredMemes } from "@/config/featuredMemes";
export default function FeaturedMemes() {
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Memes</h2><p className="text-lg text-gray-600">Community favorites. Or just ones we liked.</p></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {featuredMemes.map((m) => (<div key={m.id} className="aspect-square bg-white border-2 border-black rounded-lg overflow-hidden"><img src={m.imagePath} alt={m.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} /></div>))}
        </div>
      </div>
    </section>
  );
}'''

for path, content in files.items():
    full_path = os.path.join(os.getcwd(), path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Created: {path}')

print(f'\nPart 3 done: {len(files)} component files created.')