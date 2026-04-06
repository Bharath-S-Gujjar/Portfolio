import { Trophy, Zap, Award, X, Download, Eye } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface Achievement {
  icon: typeof Trophy;
  eventName: string;
  projectName: string;
  location: string;
  type: string;
  description: string;
  gradient: string;
  iconGradient: string;
}

const achievements: Achievement[] = [
  {
    icon: Zap,
    eventName: "24-Hour Hackathon",
    projectName: "e-Learn Application",
    location: "Vidyavardhaka College of Engineering, Mysore",
    type: "24-hour Hackathon",
    description: "Built a full-featured e-learning platform under intense time pressure, demonstrating rapid prototyping and teamwork.",
    gradient: "from-neon-purple/30 via-neon-blue/20 to-transparent",
    iconGradient: "from-neon-purple/30 to-neon-blue/10",
  },
  {
    icon: Trophy,
    eventName: "24-Hour Hackathon",
    projectName: "Anemia Detection App",
    location: "Presidency University, Bangalore",
    type: "24-hour Hackathon",
    description: "Developed a mobile health-tech solution for non-invasive anemia screening, designed for accessibility in low-resource settings.",
    gradient: "from-neon-violet/30 via-neon-magenta/20 to-transparent",
    iconGradient: "from-neon-violet/30 to-neon-magenta/10",
  },
  {
    icon: Award,
    eventName: "VTU Product Building Competition",
    projectName: "Root to Rise",
    location: "VTU Regional Center, Mysuru",
    type: "4-hour Product Building Competition",
    description: "Competed in a fast-paced product building challenge, designing and shipping a viable product concept in just 4 hours.",
    gradient: "from-accent/30 via-neon-cyan/20 to-transparent",
    iconGradient: "from-accent/30 to-neon-cyan/10",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

const CertificateModal = ({ isOpen, onClose, achievement }: { isOpen: boolean; onClose: () => void; achievement: Achievement | null }) => (
  <AnimatePresence>
    {isOpen && achievement && (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
        <motion.div
          className="relative glass-strong rounded-2xl p-8 max-w-lg w-full border border-border/50"
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg glass flex items-center justify-center hover:bg-primary/20 transition-all text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>

          <div className="text-center space-y-6">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${achievement.iconGradient} flex items-center justify-center mx-auto`}>
              <achievement.icon className="text-foreground" size={28} />
            </div>

            <div>
              <h3 className="font-heading text-2xl font-bold text-foreground mb-2">{achievement.eventName}</h3>
              <p className="text-primary font-medium">{achievement.projectName}</p>
              <p className="text-muted-foreground text-sm mt-1">{achievement.location}</p>
            </div>

            <div className="glass rounded-xl p-6 text-center">
              <div className="w-full h-48 rounded-lg bg-secondary/50 flex items-center justify-center border border-border/30">
                <div className="text-center space-y-2">
                  <Award className="text-muted-foreground mx-auto" size={40} />
                  <p className="text-muted-foreground text-sm">Certificate preview</p>
                  <p className="text-muted-foreground/60 text-xs">Coming soon</p>
                </div>
              </div>
            </div>

            <p className="text-secondary-foreground text-sm leading-relaxed">{achievement.description}</p>

            <div className="flex gap-3 justify-center">
              <button className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm magnetic-btn relative overflow-hidden group">
                <span className="relative z-10 flex items-center gap-2">
                  <Download size={14} />
                  Download
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-neon-purple to-neon-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const AchievementsSection = () => {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setModalOpen(true);
  };

  return (
    <section id="achievements" className="py-28 relative">
      <div className="container mx-auto px-6 relative z-10">
        <ScrollReveal>
          <div className="mb-16">
            <h2 className="font-heading text-4xl md:text-5xl font-bold gradient-text mb-4">Achievements</h2>
            <p className="text-muted-foreground max-w-lg">Real-world hackathons and competitions — building under pressure, shipping fast.</p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6">
          {achievements.map((item, i) => (
            <motion.div
              key={item.projectName}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
            >
              <motion.div
                className="achievement-glass gradient-border rounded-2xl p-7 h-full flex flex-col relative overflow-hidden group cursor-default"
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                {/* Top gradient accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />

                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.iconGradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className="text-foreground" size={24} />
                </div>

                {/* Event type badge */}
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary/90 border border-primary/10 mb-4 w-fit">
                  {item.type}
                </span>

                {/* Event name */}
                <h3 className="font-heading text-lg font-bold text-foreground mb-1">{item.eventName}</h3>

                {/* Project name */}
                <p className="text-primary font-medium text-sm mb-2">{item.projectName}</p>

                {/* Location */}
                <p className="text-muted-foreground text-xs mb-4">{item.location}</p>

                {/* Description */}
                <p className="text-secondary-foreground text-sm leading-relaxed mb-6 flex-1">{item.description}</p>

                {/* CTA Buttons */}
                <div className="flex gap-3">
                  <motion.button
                    onClick={() => openModal(item)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl glass text-sm text-foreground hover:border-primary/40 transition-all group/btn"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Eye size={14} className="text-muted-foreground group-hover/btn:text-primary transition-colors" />
                    View
                  </motion.button>
                  <motion.button
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-sm text-primary hover:bg-primary/20 transition-all border border-primary/10"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Download size={14} />
                    Certificate
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>

      <CertificateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        achievement={selectedAchievement}
      />
    </section>
  );
};

export default AchievementsSection;
