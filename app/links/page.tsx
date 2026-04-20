import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OfficialLinks from "@/components/OfficialLinks";
export default function LinksPage() {
  return (<div className="min-h-screen bg-white"><Header /><main className="pt-6 pb-12"><div className="max-w-4xl mx-auto px-4"><div className="text-center mb-6"><h1 className="text-4xl md:text-5xl font-bold mb-4">Official Links</h1><p className="text-lg text-gray-600">Everything TOW. All in one place.</p></div><OfficialLinks /></div></main><Footer /></div>);
}