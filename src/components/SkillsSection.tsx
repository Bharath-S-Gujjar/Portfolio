import { Code, Database, Brain, Layers } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import { motion } from "framer-motion";

const skillGroups = [
  {
    title: "Programming",
    icon: Code,
    skills: ["Java", "C"],
    color: "text-primary",
    gradient: "from-neon-purple/20 to-neon-blue/5",
  },
  {
    title: "Frameworks & Tools",
    icon: Layers,
    skills: ["Spring Boot", "Android Studio", "React"],
    color: "text-accent",
    gradient: "from-accent/20 to-neon-cyan/5",
  },
  {
    title: "AI / ML",
    icon: Brain,
    skills: ["Scikit-Learn", "Pandas", "NumPy", "YOLOv8"],
    color: "text-neon-violet",
    gradient: "from-neon-violet/20 to-neon-magenta/5",
  },
  {
    title: "Core Concepts",
    icon: Database,
    skills: ["Data Structures & Algorithms", "Backend Development", "AI Deployment"],
    color: "text-neon-magenta",
    gradient: "from-neon-magenta/20 to-neon-violet/5",
  },
];

const SkillsSection = () => (
  <section id="skills" className="py-28 relative">
    <div className="container mx-auto px-6 relative z-10">
      <ScrollReveal>
        <h2 className="font-heading text-4xl md:text-5xl font-bold gradient-text mb-16">Skills</h2>
      </ScrollReveal>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {skillGroups.map((group, i) => (
          <ScrollReveal key={group.title} delay={i * 0.1}>
            <motion.div
              className="glass rounded-xl p-6 hover-lift h-full"
              whileHover={{ rotateY: 3, rotateX: -3, scale: 1.03 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${group.gradient} flex items-center justify-center mb-4`}>
                <group.icon className={group.color} size={24} />
              </div>
              <h3 className="font-heading font-semibold text-foreground mb-4">{group.title}</h3>
              <ul className="space-y-2.5">
                {group.skills.map((skill) => (
                  <li key={skill} className="text-secondary-foreground text-sm flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {skill}
                  </li>
                ))}
              </ul>
            </motion.div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  </section>
);

export default SkillsSection;
