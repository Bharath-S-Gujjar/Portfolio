import { GraduationCap, BookOpen, Target } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import { motion } from "framer-motion";

const cards = [
  {
    icon: GraduationCap,
    title: "Education",
    content: (
      <>
        <p className="text-secondary-foreground text-sm">B.E. in Computer Science and Engineering</p>
        <p className="text-muted-foreground text-sm">S D M Institute of Technology, Dakshina Kannada</p>
        <p className="text-muted-foreground text-sm">2023 – Ongoing</p>
      </>
    ),
    color: "text-primary",
  },
  {
    icon: Target,
    title: "CGPA",
    content: <p className="text-4xl font-bold gradient-text">8.68 / 10</p>,
    color: "text-accent",
  },
  {
    icon: BookOpen,
    title: "Focus",
    content: <p className="text-secondary-foreground text-sm">Backend Development • AI Systems • DSA Mastery</p>,
    color: "text-neon-violet",
  },
];

const AboutSection = () => (
  <section id="about" className="py-28 relative">
    <div className="container mx-auto px-6 relative z-10">
      <ScrollReveal>
        <h2 className="font-heading text-4xl md:text-5xl font-bold gradient-text mb-16">About Me</h2>
      </ScrollReveal>

      <div className="grid md:grid-cols-2 gap-12">
        <ScrollReveal direction="left" delay={0.1}>
          <div className="space-y-6 text-secondary-foreground leading-relaxed">
            <p>
              I'm Bharath S Gujjar, a Computer Science undergraduate specializing in Java backend development
              and AI-driven systems. I'm passionate about building meaningful applications that solve real-world problems.
            </p>
            <p>
              My journey spans from experimental AI projects to production-level backend systems,
              with a strong focus on Spring Boot mastery and Data Structures & Algorithms.
            </p>
          </div>
        </ScrollReveal>

        <div className="space-y-5">
          {cards.map((card, i) => (
            <ScrollReveal key={card.title} direction="right" delay={0.1 + i * 0.15}>
              <motion.div
                className="glass rounded-xl p-6 hover-lift cursor-default"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <card.icon className={card.color} size={22} />
                  <h3 className="font-heading font-semibold text-foreground">{card.title}</h3>
                </div>
                {card.content}
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default AboutSection;
