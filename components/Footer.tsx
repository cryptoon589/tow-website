import Link from "next/link";
import { officialLinks } from "@/config/site";
export default function Footer() {
  return (
    <footer className="border-t border-black bg-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center"><span className="text-white font-bold text-lg">TOW</span></div>
              <span className="font-bold text-xl">Tired Of Winning</span>
            </div>
            <p className="text-sm text-gray-600">Too tired to quit. Still here.</p>
          </div>
          <div>
            <h3 className="font-bold mb-4">Official Links</h3>
            <div className="grid grid-cols-2 gap-2">
              {officialLinks.map((link) => (<Link key={link.label} href={link.url} target={link.url.startsWith("http") ? "_blank" : undefined} rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined} className="text-sm hover:text-gray-600">{link.label}</Link>))}
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-black text-center text-sm text-gray-600"><p>&copy; {new Date().getFullYear()} TOW. All rights reserved.</p></div>
      </div>
    </footer>
  );
}