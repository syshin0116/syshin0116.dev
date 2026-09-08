import { Suspense } from "react";
import Footer from "@/components/footer";
import { Navbar } from "@/components/navbar";
import ChatSection from "@/components/assistant/chat-section";
import { RecentPosts } from "@/components/recent-posts";
import { RecentProjects } from "@/components/recent-projects";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Suspense
          fallback={
            <div
              className="w-full h-[calc(100svh-3.5rem-1px)] flex items-center justify-center"
              role="status"
            >
              불러오는 중…
            </div>
          }
        >
          <ChatSection />
        </Suspense>

        <div className="border-t border-border/60">
          <div className="mx-auto grid w-full max-w-5xl gap-12 px-6 py-16 md:grid-cols-2 md:gap-16 md:py-20">
            <RecentPosts />
            <RecentProjects />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
