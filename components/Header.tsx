"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { navItems } from "@/config/site";

export default function Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", open);
    return () => document.body.classList.remove("overflow-hidden");
  }, [open]);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2"
          aria-label="Tired Of Winning home"
        >
          <img src="/assets/logo/tow-logo.svg" alt="TOW" className="w-10 h-10" />
          <span className="font-bold text-xl hidden sm:block">Tired Of Winning</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium hover:text-gray-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="md:hidden p-2 -mr-2"
          aria-label="Open menu"
          aria-expanded={open}
        >
          <div className="w-6 h-5 flex flex-col justify-between">
            <span className="block h-0.5 bg-black" />
            <span className="block h-0.5 bg-black" />
            <span className="block h-0.5 bg-black" />
          </div>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] bg-white md:hidden mobile-safe overflow-y-auto">
          <div className="flex items-center justify-between border-b border-black px-6 py-5">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2"
              aria-label="Tired Of Winning home"
            >
              <img src="/assets/logo/tow-logo.svg" alt="TOW" className="w-12 h-12" />
              <span className="sr-only">Tired Of Winning</span>
            </Link>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-12 w-12 items-center justify-center rounded-full text-black"
              aria-label="Close menu"
            >
              <span className="relative block h-10 w-10">
                <span className="absolute left-1/2 top-1/2 block h-0.5 w-10 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-black" />
                <span className="absolute left-1/2 top-1/2 block h-0.5 w-10 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-black" />
              </span>
            </button>
          </div>

          <nav className="px-6 py-8">
            <div className="flex flex-col gap-7 text-[17px] font-semibold leading-none">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block w-full py-1 text-black hover:text-gray-600"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
