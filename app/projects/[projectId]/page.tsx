import { Navbar } from "@/components/navbar";
import Footer from "@/components/footer";
import ProjectDetailTemplate from "@/components/project-detail-template";
import { getProjectDetail, getProjectsTimeline } from "@/lib/supabase-queries";
import { notFound } from "next/navigation";
import { Metadata } from "next";

interface ProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { projectId } = await params;
  const project = await getProjectDetail(projectId);
  
  if (!project) {
    return {
      title: "Project Not Found",
    };
  }

  return {
    title: `${project.title} | Syshin's Portfolio`,
    description: project.description,
  };
}

export async function generateStaticParams() {
  const projectsTimeline = await getProjectsTimeline();
  return projectsTimeline.map((project) => ({
    projectId: project.id,
  }));
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  const project = await getProjectDetail(projectId);

  if (!project) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <ProjectDetailTemplate project={project} />
      <Footer />
    </>
  );
}
