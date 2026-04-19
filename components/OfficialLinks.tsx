import Link from "next/link";
import { officialLinks } from "@/config/site";
export default function OfficialLinks() {
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-bold mb-4">Official Links</h2><p className="text-lg text-gray-600">Everything you need. All in one place.</p></div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {officialLinks.map((link) => (<Link key={link.label} href={link.url} target={link.url.startsWith("http") ? "_blank" : undefined} rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined} className="block p-6 bg-white border-2 border-black rounded-lg hover:bg-black hover:text-white transition-colors group"><h3 className="font-bold text-lg mb-2">{link.label}</h3><p className="text-sm text-gray-600 group-hover:text-gray-300">{link.description}</p></Link>))}
        </div>
      </div>
    </section>
  );
}