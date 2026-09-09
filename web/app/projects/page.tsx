import { Navbar } from "@/components/navbar";
import Footer from "@/components/footer";
import ProjectList from "@/components/project-list";
import { projectsTimeline } from "@/data/projects";

export const metadata = {
  title: "Projects | Syshin's Portfolio",
  description: "Explore Syshin's major AI and Machine Learning projects.",
};

export default function ProjectsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <ProjectList projects={projectsTimeline} />
      </main>
      <Footer />
    </>
  );
}
