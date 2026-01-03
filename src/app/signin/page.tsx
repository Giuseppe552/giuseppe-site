"use client";

import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SignInContent from "./signin-content";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Header />
      <Suspense fallback={<div className="h-screen bg-black" />}>
        <SignInContent />
      </Suspense>
      <Footer className="pt-10" />
    </main>
  );
}
