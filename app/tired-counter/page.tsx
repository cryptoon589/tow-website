import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TiredCounter from "@/components/TiredCounter";

export default function TiredCounterPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        <TiredCounter initialCount={0} />

        <section className="py-12 md:py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">What is this?</h2>

            <div className="space-y-4 text-lg text-gray-600">
              <p>The Tired Counter tracks how many times people press TIRED.</p>
              <p>Every press means someone else gets it.</p>
              <p>No leaderboard. No utility. No promises. Just proof that you're not tired alone.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}