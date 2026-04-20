import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MemeEditor from "@/components/MemeEditor";

export default function MemeGeneratorPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        <section className="py-10 md:py-12">
          <div className="max-w-6xl mx-auto px-4">

            {/* TITLE */}
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Meme Generator
              </h1>
              <p className="text-lg text-gray-600">
                Make something tired. Export it. Post it.
              </p>
            </div>

            {/* THIS IS THE IMPORTANT PART */}
            <MemeEditor />

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}