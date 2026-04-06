import { ExternalLink, Cpu, Eye, Smartphone, ShoppingCartIcon } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import { motion } from "framer-motion";

const projects = [
  {
    icon: Cpu,
    title: "Smart Farming AI Advisory System",
    role: "Lead Developer",
    description: "Offline AI pipeline using RandomForestClassifier that predicts crop risks and gives recommendations.",
    highlights: ["Reproducibility", "Robust data handling", "Offline-first"],
    gradient: "from-neon-purple/20 to-neon-blue/5",
    link: "https://crop-ai-advisor.vercel.app/",
  },
  {
    icon: ShoppingCartIcon,
    title: "EcoFinds - Fullstack Marketplace",
    role: "Fullstack Developer",
    description: "Sustainable e-commerce platform built with Node js, Express js, React and Tailwind CSS, featuring real-time inventory and secure payments.",
    highlights: ["Fullstack", "Sustainability", "Marketing"],
    gradient: "from-neon-violet/20 to-neon-magenta/5",
    link: "https://eco-finds-beta.vercel.app/",
  },
  {
    icon: Eye,
    title: "Project Drishti: AI Crowd Detection",
    role: "Computer Vision Developer",
    description: "Real-time crowd detection using YOLOv8 + OpenCV, optimized for speed and varying conditions.",
    highlights: ["Real-time", "YOLOv8", "Optimized performance"],
    gradient: "from-accent/20 to-neon-cyan/5",
    link: "",
  },
  {
    icon: Smartphone,
    title: "Mobile Anemia Detection App",
    role: "Android Developer",
    description: "Offline mobile application for health screening, designed for accessibility in low-resource environments.",
    highlights: ["Offline-first", "Accessibility", "Health-tech"],
    gradient: "from-neon-cyan/20 to-neon-purple/5",
    link: "",
  },
];

const ProjectsSection = () => (
  <section id="projects" className="py-28 relative">
    <div className="container mx-auto px-6 relative z-10">
      <ScrollReveal>
        <h2 className="font-heading text-4xl md:text-5xl font-bold gradient-text mb-16">Projects</h2>
      </ScrollReveal>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {projects.map((project, i) => (
          <ScrollReveal key={project.title} delay={i * 0.1}>
            <motion.div
              className="glass rounded-xl overflow-hidden hover-lift h-full group"
              whileHover={{ rotateY: 5, rotateX: -3, scale: 1.03 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className={`h-1.5 bg-gradient-to-r ${project.gradient}`} />
              <div className="p-7">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${project.gradient} flex items-center justify-center`}>
                    <project.icon className="text-primary" size={20} />
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
                  {project.highlights.map((h) => (
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
  </section>
);

export default ProjectsSection;
