import { Suspense } from "react";
import Footer from "@/components/footer";
import { Navbar } from "@/components/navbar";
import ChatSection from "@/components/chat-section";

export default function Home() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="w-full h-[100dvh] md:h-[calc(100vh-73px)] flex items-center justify-center">Loading...</div>}>
        <ChatSection />
      </Suspense>
      <Footer />
    </>
  );
}
