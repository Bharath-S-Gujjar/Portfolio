import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { fetchProjects, type Project } from "@/lib/api";

const fallbackProjects: Project[] = [
  {
    _id: "project-1",
    title: "Smart Farming AI Advisory System",
    role: "Lead Developer",
    description: "Offline AI pipeline using RandomForestClassifier that predicts crop risks and gives recommendations.",
    highlights: ["Reproducibility", "Robust data handling", "Offline-first"],
    gradient: "from-neon-purple/20 to-neon-blue/5",
    link: "https://crop-ai-advisor.vercel.app/",
  },
  {
    _id: "project-2",
    title: "EcoFinds - Fullstack Marketplace",
    role: "Fullstack Developer",
    description: "Sustainable e-commerce platform built with Node js, Express js, React and Tailwind CSS, featuring real-time inventory and secure payments.",
    highlights: ["Fullstack", "Sustainability", "Marketing"],
    gradient: "from-neon-violet/20 to-neon-magenta/5",
    link: "https://eco-finds-beta.vercel.app/",
  },
  {
    _id: "project-3",
    title: "Project Drishti: AI Crowd Detection",
    role: "Computer Vision Developer",
    description: "Real-time crowd detection using YOLOv8 + OpenCV, optimized for speed and varying conditions.",
    highlights: ["Real-time", "YOLOv8", "Optimized performance"],
    gradient: "from-accent/20 to-neon-cyan/5",
    link: "",
  },
  {
    _id: "project-4",
    title: "Mobile Anemia Detection App",
    role: "Android Developer",
    description: "Offline mobile application for health screening, designed for accessibility in low-resource environments.",
    highlights: ["Offline-first", "Accessibility", "Health-tech"],
    gradient: "from-neon-cyan/20 to-neon-purple/5",
    link: "",
  },
];

const ProjectsSection = () => {
  const [projects, setProjects] = useState<Project[]>(fallbackProjects);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const sliderRef = useRef<HTMLDivElement | null>(null);

  const scrollToIndex = (index: number) => {
    if (!sliderRef.current) return;
    const target = sliderRef.current.children[index] as HTMLElement | undefined;
    if (!target) return;
    sliderRef.current.scrollTo({ left: target.offsetLeft, behavior: "smooth" });
    setActiveIndex(index);
  };

  const handleScroll = (direction: "left" | "right") => {
    const nextIndex = direction === "left" ? Math.max(activeIndex - 1, 0) : Math.min(activeIndex + 1, projects.length - 1);
    scrollToIndex(nextIndex);
  };

  const updateActiveIndex = () => {
    if (!sliderRef.current) return;
    const scrollLeft = sliderRef.current.scrollLeft;
    const children = Array.from(sliderRef.current.children) as HTMLElement[];
    let closest = 0;
    let minDiff = Infinity;
    children.forEach((child, index) => {
      const diff = Math.abs(child.offsetLeft - scrollLeft);
      if (diff < minDiff) {
        minDiff = diff;
        closest = index;
      }
    });
    setActiveIndex(closest);
  };

  useEffect(() => {
    if (!sliderRef.current) return;
    const slider = sliderRef.current;
    slider.addEventListener("scroll", updateActiveIndex, { passive: true });
    return () => slider.removeEventListener("scroll", updateActiveIndex);
  }, [projects]);

  useEffect(() => {
    if (isPaused || projects.length <= 1) return;
    const interval = window.setInterval(() => {
      const nextIndex = activeIndex === projects.length - 1 ? 0 : activeIndex + 1;
      scrollToIndex(nextIndex);
    }, 4500);
    return () => window.clearInterval(interval);
  }, [activeIndex, projects.length, isPaused]);

  useEffect(() => {
    fetchProjects()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProjects(data.map((project) => ({
            ...project,
            gradient: project.gradient || "from-neon-purple/20 to-neon-blue/5",
          })));
        }
      })
      .catch(() => {
        setProjects(fallbackProjects);
      });
  }, []);

  return (
    <section id="projects" className="py-28 relative">
      <div className="container mx-auto px-6 relative z-10">
        <ScrollReveal>
          <h2 className="font-heading text-4xl md:text-5xl font-bold gradient-text mb-16">Projects</h2>
        </ScrollReveal>

        <div className="relative">
          <button
            type="button"
            onClick={() => handleScroll("left")}
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow-xl shadow-background/30 ring-1 ring-border/50 hover:bg-background transition-opacity"
            aria-label="Scroll projects left"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => handleScroll("right")}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow-xl shadow-background/30 ring-1 ring-border/50 hover:bg-background transition-opacity"
            aria-label="Scroll projects right"
          >
            <ChevronRight size={20} />
          </button>

          <div className="overflow-hidden rounded-3xl" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
            <div
              ref={sliderRef}
              className="flex gap-6 px-6 py-4 snap-x snap-mandatory overflow-x-auto scroll-smooth scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary/30 scrollbar-thumb-rounded-full"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {projects.map((project, i) => (
                <ScrollReveal key={project.title} delay={i * 0.1}>
                  <motion.div
                    className="snap-start min-w-[300px] md:min-w-[340px] max-w-[340px] flex-none glass rounded-xl overflow-hidden hover-lift h-[420px] group"
                    whileHover={{ rotateY: 5, rotateX: -3, scale: 1.03 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    <div className={`h-1.5 bg-gradient-to-r ${project.gradient}`} />
                    <div className="p-7">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${project.gradient} flex items-center justify-center`}>
                          <ExternalLink className="text-primary" size={20} />
                        </div>
                        {project.link ? (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-lg glass flex items-center justify-center hover:bg-primary/20 transition-all"
                          >
                            <ExternalLink className="text-muted-foreground group-hover:text-primary transition-colors" size={14} />
                          </a>
                        ) : (
                          <div className="w-8 h-8 rounded-lg glass flex items-center justify-center opacity-30">
                            <ExternalLink className="text-muted-foreground" size={14} />
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground uppercase tracking-widest">{project.role}</span>
                      <h3 className="font-heading text-base font-bold text-foreground mt-2 mb-3 leading-tight">{project.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-5">{project.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {(project.highlights || []).map((h) => (
                          <span
                            key={h}
                            className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary/80 border border-primary/10"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </ScrollReveal>
              ))}
            </div>
          </div>
          <div className="mt-4 flex justify-center gap-2">
            {projects.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => scrollToIndex(index)}
                className={`h-2.5 w-2.5 rounded-full transition-all ${index === activeIndex ? "bg-primary" : "bg-border/60 hover:bg-border"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;
