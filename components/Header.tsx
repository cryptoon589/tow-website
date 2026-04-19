"use client";
import Link from "next/link";
import { useState } from "react";
import { navItems } from "@/config/site";
export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-black">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/assets/logo/tow-logo.svg" alt="TOW" className="w-10 h-10" />
          <span className="font-bold text-xl hidden sm:block">Tired Of Winning</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (<Link key={item.href} href={item.href} className="text-sm font-medium hover:text-gray-600">{item.label}</Link>))}
        </nav>
        <button onClick={() => setOpen(!open)} className="md:hidden p-2">
          <div className="w-6 h-5 flex flex-col justify-between">
            <span className={`block h-0.5 bg-black transition-transform ${open ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block h-0.5 bg-black transition-opacity ${open ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 bg-black transition-transform ${open ? "-rotate-45 -translate-y-2" : ""}`} />
          </div>
        </button>
      </div>
      {open && (<nav className="md:hidden mt-4 pb-4 border-t border-black pt-4">{navItems.map((item) => (<Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="block py-2 text-sm font-medium">{item.label}</Link>))}</nav>)}
    </header>
  );
}