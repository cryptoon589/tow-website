import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TiredCounter from "@/components/TiredCounter";
export default function TiredCounterPage() {
  return (<div className="min-h-screen bg-white"><Header /><main><TiredCounter initialCount={0} /><section className="py-16 md:py-24"><div className="max-w-4xl mx-auto px-4 text-center"><h2 className="text-3xl md:text-4xl font-bold mb-6">What is this?</h2><div className="space-y-4 text-lg text-gray-600"><p>The Tired Counter tracks how many times people have pressed the TIRED button.</p><p>Each press represents another soul who understands the eternal fatigue of existence.</p><p>There is no leaderboard. There are no rewards. Just tiredness. Shared tiredness.</p></div></div></section></main><Footer /></div>);
}