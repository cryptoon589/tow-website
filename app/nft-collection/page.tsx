"use client";
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
}