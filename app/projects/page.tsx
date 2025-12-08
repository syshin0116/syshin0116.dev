import { Navbar } from "@/components/navbar";
import Footer from "@/components/footer";
import ProjectTimelineComponent from "@/components/project-timeline";
import { projectsTimeline } from "@/data/projects";

export const metadata = {
  title: "Projects | Syshin's Portfolio",
  description: "Explore Syshin's major AI and Machine Learning projects including SK PharmaAIX MR Assistant and KATECH AI Agent.",
};

export default function ProjectsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <ProjectTimelineComponent projects={projectsTimeline} />
      </main>
      <Footer />
    </>
  );
}
