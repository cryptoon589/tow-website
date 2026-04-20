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
                className="w-full h-auto border border-black/20 rounded-lg shadow-sm"
              />
            </div>

            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                NFT Collection
              </h1>

              <p className="text-lg text-gray-600 mb-4">
                Beneath the black-line simplicity lies a familiar journey through cycles, emotion, and time. Some might be tired of winning. Others are just… tired.
              </p>

              <p className="text-gray-500 mb-6">
                Simple. Clean. Tired.
              </p>

              <div className="flex gap-4 flex-wrap">
                <a
                  href="https://xrp.cafe/collection/tired-of-winning"
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3 border-2 border-black font-bold rounded hover:bg-black hover:text-white transition"
                >
                  View on xrp.cafe
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