"use client";

import { motion } from "framer-motion";
import { Calendar, CheckCircle, Briefcase, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ProjectTimeline } from "@/data/projects";

interface ProjectTimelineComponentProps {
  projects: ProjectTimeline[];
}

export default function ProjectTimelineComponent({ projects }: ProjectTimelineComponentProps) {

  const formatPeriod = (project: ProjectTimeline) => {
    if (project.periodType === "Q") {
      return `Q${project.periodNumber} ${project.year}`;
    } else if (project.periodType === "H") {
      return `H${project.periodNumber} ${project.year}`;
    }
    return `${project.year}`;
  };

  return (
    <div className="mx-auto px-4 py-12 max-w-5xl">
      <motion.h1
        className="text-3xl md:text-4xl font-bold mb-2 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Project Timeline
      </motion.h1>

      <motion.p
        className="text-muted-foreground text-center mb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        주요 프로젝트 및 개발 여정
      </motion.p>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-0 md:left-1/2 transform md:-translate-x-1/2 h-full w-0.5 bg-primary/20 z-0"></div>

        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            className={`mb-12 relative z-10 flex flex-col ${
              index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
            }`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
          >
            {/* Timeline dot */}
            <div className="absolute left-0 md:left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-primary z-10 flex items-center justify-center">
              <div className={`w-3 h-3 rounded-full ${project.isCompleted ? 'bg-green-500' : 'bg-white'}`}></div>
            </div>

            {/* Date badge */}
            <div
              className={`md:w-1/2 flex ${
                index % 2 === 0
                  ? "md:justify-end md:pr-8"
                  : "md:justify-start md:pl-8"
              }`}
            >
              <motion.div className="mb-4 md:mb-0" whileHover={{ scale: 1.05 }}>
                <Badge
                  variant="outline"
                  className="text-sm py-1 px-3 bg-primary/5 border-primary/20"
                >
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatPeriod(project)}
                </Badge>
              </motion.div>
            </div>

            {/* Card */}
            <div
              className={`md:w-1/2 ${index % 2 === 0 ? "md:pl-8" : "md:pr-8"}`}
            >
              <Link href={`/projects/${project.id}`}>
                <motion.div
                  layout
                  className="w-full"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className="overflow-hidden border-primary/10 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        {/* Header with Category Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-xl font-bold text-primary flex-1">
                            {project.title}
                          </h3>
                          <Badge 
                            variant={project.category === "company" ? "default" : "outline"}
                            className="text-xs whitespace-nowrap"
                          >
                            {project.category === "company" ? (
                              <>
                                <Briefcase className="w-3 h-3 mr-1" />
                                회사
                              </>
                            ) : (
                              <>
                                <User className="w-3 h-3 mr-1" />
                                개인
                              </>
                            )}
                          </Badge>
                        </div>
                        
                        {/* Period */}
                        <p className="text-sm text-muted-foreground">
                          {project.period}
                        </p>
                        
                        {/* Description */}
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {project.description}
                        </p>
                        
                        {/* Status */}
                        <div className="flex items-center text-sm">
                          <CheckCircle
                            className={`w-4 h-4 mr-1 ${
                              project.isCompleted
                                ? "text-green-500"
                                : "text-yellow-500"
                            }`}
                          />
                          <span className={project.isCompleted ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}>
                            {project.isCompleted ? "완료" : "진행 중"}
                          </span>
                        </div>
                        
                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                          {project.tags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
