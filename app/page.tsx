"use client";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import GamePromo from "@/components/GamePromo";
import TiredCounter from "@/components/TiredCounter";
import MemeTemplateGrid from "@/components/MemeTemplateGrid";
import OfficialLinks from "@/components/OfficialLinks";
import NftHighlight from "@/components/NftHighlight";
import FeaturedMemes from "@/components/FeaturedMemes";
import Footer from "@/components/Footer";
export default function Home() {
  return (<div className="min-h-screen bg-white"><Header /><main><HeroSection /><GamePromo /><TiredCounter /><MemeTemplateGrid /><NftHighlight /><FeaturedMemes /><OfficialLinks /></main><Footer /></div>);
}