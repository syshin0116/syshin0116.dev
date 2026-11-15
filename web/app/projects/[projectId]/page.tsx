import { Navbar } from "@/components/navbar";
import Footer from "@/components/footer";
import ProjectDetailTemplate from "@/components/project-detail-template";
import notesList from "@/.generated/notes-list.json";
import { projectById, projects } from "@/data/projects";
import { adjacentProjects, seriesPosts } from "@/lib/projects";
import { SITE_URL } from "@/lib/site";
import { notFound } from "next/navigation";
import { Metadata } from "next";

interface ProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { projectId } = await params;
  const project = projectById[projectId];

  if (!project) {
    return {
      title: "Project Not Found",
    };
  }

  return {
    title: project.title,
    description: project.description,
    openGraph: {
      title: project.title,
      description: project.description,
      url: `${SITE_URL}/projects/${projectId}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

export async function generateStaticParams() {
  return projects.map((project) => ({
    projectId: project.id,
  }));
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  const project = projectById[projectId];

  if (!project) {
    notFound();
  }

  const { previous, next } = adjacentProjects(projects, project.id);
  const posts = seriesPosts(project.blogSeries, notesList).map(({ slug, title, date }) => ({ slug, title, date }));

  return (
    <>
      <Navbar />
      <ProjectDetailTemplate
        project={project}
        seriesPosts={posts}
        previous={previous && { id: previous.id, title: previous.title }}
        next={next && { id: next.id, title: next.title }}
      />
      <Footer />
    </>
  );
}
