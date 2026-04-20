import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NFTCarousel from "@/components/NFTCarousel";

export default function NFTCollectionPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        <section className="py-10 md:py-12">
          <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
            <div className="w-full max-w-[400px] mx-auto">
              <img
                src="/assets/nfts/preview.png"
                alt="TOW NFT Preview"
                className="w-full h-auto border border-black/20 rounded-lg shadow-sm"
              />
            </div>

            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                NFT Collection
              </h1>

              <p className="text-lg text-gray-600 mb-4">
                Doodle-style characters living their best tired lives on the XRPL.
              </p>

              <p className="text-gray-500 mb-6">
                Simple. Clean. Tired.
              </p>

              <div className="flex gap-4 flex-wrap">
                <a
                  href="https://xrpscan.com"
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3 bg-black text-white font-bold rounded hover:bg-gray-800 transition"
                >
                  View on XRPL
                </a>

                <a
                  href="https://xrp.cafe"
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3 border-2 border-black font-bold rounded hover:bg-black hover:text-white transition"
                >
                  View on Marketplace
                </a>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 pb-12">
          <NFTCarousel />
        </div>
      </main>

      <Footer />
    </div>
  );
}