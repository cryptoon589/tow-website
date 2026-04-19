import os
os.chdir(r'C:\Users\ahmad\Downloads\tow-website')

# MemeEditor.tsx
editor = '''"use client";
import { useState, useRef, useEffect } from "react";
import { memeTemplates, MemeTemplate } from "@/config/memeTemplates";
export default function MemeEditor() {
  const [template, setTemplate] = useState<MemeTemplate>(memeTemplates[0]);
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [size, setSize] = useState(48);
  const [upper, setUpper] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const t: Record<string, string> = {}; template.textFields.forEach((f) => { t[f.id] = f.defaultText; }); setTexts(t); }, [template]);
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const img = new Image(); img.crossOrigin = "anonymous"; img.src = template.imagePath;
    img.onload = () => {
      c.width = template.width; c.height = template.height;
      ctx.drawImage(img, 0, 0, c.width, c.height);
      template.textFields.forEach((f) => {
        const txt = texts[f.id] || "";
        const d = upper ? txt.toUpperCase() : txt;
        ctx.font = `bold ${size}px Arial, sans-serif`; ctx.fillStyle = "white"; ctx.strokeStyle = "black"; ctx.lineWidth = 4;
        ctx.textAlign = f.align || "center"; ctx.textBaseline = "middle";
        ctx.strokeText(d, f.x, f.y); ctx.fillText(d, f.x, f.y);
      });
    };
    img.onerror = () => { c.width = template.width; c.height = template.height; ctx.fillStyle = "#f3f4f6"; ctx.fillRect(0, 0, c.width, c.height); ctx.fillStyle = "#9ca3af"; ctx.font = "bold 24px Arial"; ctx.textAlign = "center"; ctx.fillText(template.name, c.width / 2, c.height / 2); };
  }, [template, texts, size, upper]);
  const download = () => { const c = canvasRef.current; if (!c) return; const a = document.createElement("a"); a.download = `tow-meme-${Date.now()}.png`; a.href = c.toDataURL("image/png"); a.click(); };
  return (
    <div className="space-y-8">
      <div><h3 className="font-bold text-lg mb-4">Choose Template</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{memeTemplates.map((t) => (<button key={t.id} onClick={() => setTemplate(t)} className={`aspect-square border-2 rounded-lg overflow-hidden ${template.id === t.id ? "border-black bg-gray-100" : "border-gray-300"}`}><img src={t.imagePath} alt={t.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} /></button>))}</div></div>
      <div><h3 className="font-bold text-lg mb-4">Preview</h3><div className="bg-gray-50 border-2 border-black rounded-lg p-4 inline-block"><canvas ref={canvasRef} className="max-w-full h-auto" style={{ maxWidth: "100%", height: "auto" }} /></div></div>
      <div><h3 className="font-bold text-lg mb-4">Edit Text</h3><div className="space-y-4 max-w-2xl">{template.textFields.map((f) => (<div key={f.id}><label className="block text-sm font-medium mb-2">{f.label}</label><input type="text" value={texts[f.id] || ""} onChange={(e) => setTexts((p) => ({ ...p, [f.id]: e.target.value }))} className="w-full px-4 py-2 border-2 border-black rounded" /></div>))}<div><label className="block text-sm font-medium mb-2">Size: {size}px</label><input type="range" min="24" max="72" value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-full" /></div><div className="flex items-center gap-2"><input type="checkbox" id="up" checked={upper} onChange={(e) => setUpper(e.target.checked)} /><label htmlFor="up">UPPERCASE</label></div></div></div>
      <div><button onClick={download} className="px-8 py-4 bg-black text-white font-bold rounded-lg hover:bg-gray-800">Download Meme</button></div>
    </div>
  );
}'''

with open('components/MemeEditor.tsx', 'w', encoding='utf-8') as f:
    f.write(editor)
print('Created: components/MemeEditor.tsx')

# NFT page
nft = '''"use client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
export default function NftCollectionPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-12"><h1 className="text-4xl md:text-5xl font-bold mb-4">NFT Collection</h1><p className="text-lg text-gray-600">The official TOW NFT collection on XRPL.</p></div>
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div className="aspect-square bg-gray-50 border-2 border-black rounded-lg overflow-hidden flex items-center justify-center relative"><img src="/assets/nft/preview.png" alt="NFT" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} /><div className="absolute text-center p-8 pointer-events-none"><div className="text-6xl mb-4">&#127912;</div><p className="text-gray-400">Add preview image</p></div></div>
            <div className="flex flex-col justify-center">
              <h2 className="text-3xl font-bold mb-6">TOW Characters</h2>
              <p className="text-lg text-gray-600 mb-6">Doodle-style characters living their best tired lives on the XRPL.</p>
              <p className="text-lg text-gray-600 mb-8">Simple. Clean. Tired.</p>
              <div className="flex flex-wrap gap-4">
                <Link href="https://xrpscan.com/collection/YOUR_ID" target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-black text-white font-bold rounded hover:bg-gray-800">View on XRPScan</Link>
                <Link href="https://marketplace.xrpl.org/collection/YOUR_ID" target="_blank" rel="noopener noreferrer" className="px-6 py-3 border-2 border-black font-bold rounded hover:bg-black hover:text-white">View on Marketplace</Link>
              </div>
            </div>
          </div>
          <div><h2 className="text-2xl font-bold mb-8">Gallery</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4,5,6,7,8].map((i) => (<div key={i} className="aspect-square bg-gray-50 border-2 border-black rounded-lg overflow-hidden flex items-center justify-center relative"><img src={`/assets/nft/nft-${i}.png`} alt={`NFT #${i}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} /><div className="absolute text-center p-4 pointer-events-none"><p className="text-xs text-gray-400">NFT #{i}</p></div></div>))}</div></div>
        </div>
      </main>
      <Footer />
    </div>
  );
}'''

with open('app/nft-collection/page.tsx', 'w', encoding='utf-8') as f:
    f.write(nft)
print('Created: app/nft-collection/page.tsx')

print('\nAll files created! Run: npm install && npm run build')