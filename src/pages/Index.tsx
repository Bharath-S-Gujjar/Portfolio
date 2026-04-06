import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import SkillsSection from "@/components/SkillsSection";
import AchievementsSection from "@/components/AchievementsSection";
import ProjectsSection from "@/components/ProjectsSection";
import ContactSection from "@/components/ContactSection";
import AnimatedBackground from "@/components/AnimatedBackground";
import { motion } from "framer-motion";

const Index = () => (
  <div className="min-h-screen bg-background noise-bg">
    <AnimatedBackground />
    <Navbar />
    <HeroSection />
    <AboutSection />
    <SkillsSection />
    <AchievementsSection />
    <ProjectsSection />
    <ContactSection />
    <motion.footer
      className="py-8 border-t border-border/50 text-center text-sm text-muted-foreground relative z-10"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      © 2025 Bharath S Gujjar. All rights reserved.
    </motion.footer>
  </div>
);

export default Index;
