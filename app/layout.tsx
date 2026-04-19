import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "TOW - Tired Of Winning", description: "The home of tired memes." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body className="antialiased">{children}</body></html>);
}