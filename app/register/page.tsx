"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RegisterForm from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <RegisterForm />
      </main>
      <Footer />
    </div>
  );
}
