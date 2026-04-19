import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MemeEditor from "@/components/MemeEditor";
export default function MemeGeneratorPage() {
  return (<div className="min-h-screen bg-white"><Header /><main className="py-12"><div className="max-w-6xl mx-auto px-4"><div className="mb-12"><h1 className="text-4xl md:text-5xl font-bold mb-4">Meme Generator</h1><p className="text-lg text-gray-600">Choose a template, add text, download.</p></div><MemeEditor /></div></main><Footer /></div>);
}