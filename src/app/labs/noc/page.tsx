"use client";

import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NocContent from "./noc-content";

export default function NocPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Header />
      <Suspense fallback={<div className="h-screen bg-black" />}>
        <NocContent />
      </Suspense>
      <Footer />
    </main>
  );
}
