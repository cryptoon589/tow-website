import Link from "next/link";
export default function NftHighlight() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
        <div className="aspect-square bg-gray-50 border-2 border-black rounded-lg overflow-hidden"><img src="/assets/nft/preview.png" alt="NFT" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} /></div>
        <div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">NFT Collection</h2>
          <p className="text-lg text-gray-600 mb-8">Beneath the black-line simplicity lies a familiar journey through cycles, emotion, and time. Some might be tired of winning. Others are just… tired.</p>
          <Link href="/nft-collection" className="inline-block px-8 py-4 bg-black text-white font-bold rounded-lg hover:bg-gray-800">View NFT Collection</Link>
        </div>
      </div>
    </section>
  );
}