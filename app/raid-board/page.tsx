import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RaidBoard from "@/components/RaidBoard";

export default function RaidBoardPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <RaidBoard />
      </main>
      <Footer />
    </div>
  );
}
