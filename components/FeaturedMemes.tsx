import { featuredMemes } from "@/config/featuredMemes";
export default function FeaturedMemes() {
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Memes</h2><p className="text-lg text-gray-600">Community favorites. Or just ones we liked.</p></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {featuredMemes.map((m) => (<div key={m.id} className="aspect-square bg-white border-2 border-black rounded-lg overflow-hidden"><img src={m.imagePath} alt={m.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} /></div>))}
        </div>
      </div>
    </section>
  );
}