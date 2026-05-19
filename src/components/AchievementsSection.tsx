import { Trophy, Zap, Award, X, Download, Eye, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { fetchCertificates, type Certificate } from "@/lib/api";

const iconMap: Record<string, typeof Trophy> = {
  Hackathon: Zap,
  "Product Building Competition": Award,
  "Idea Presentation Contest": Award,
};

const gradients = [
  { gradient: "from-neon-purple/30 via-neon-blue/20 to-transparent", iconGradient: "from-neon-purple/30 to-neon-blue/10" },
  { gradient: "from-neon-violet/30 via-neon-magenta/20 to-transparent", iconGradient: "from-neon-violet/30 to-neon-magenta/10" },
  { gradient: "from-accent/30 via-neon-cyan/20 to-transparent", iconGradient: "from-accent/30 to-neon-cyan/10" },
];

const ACHIEVEMENTS_CONFIG_URL = "/certificates/achievements.json";

// Fallback data when backend is unavailable
const fallbackCertificates: Certificate[] = [
  {
    title: "Mini-Anveshana 2024",
    event: "Idea Presentation Contest",
    college: "SDM Institute of Technology (SDMIT)",
    location: "Ujire",
    date: "18 October 2024",
    description: "Certificate of Appreciation for participating in the Mini-Anveshana 2024 idea presentation contest.",
    fileName: "mini-anveshana-2024.pdf",
  },
  {
    title: "INFOTHON 4.0",
    event: "National Level Hackathon",
    college: "Vidyavardhaka College of Engineering",
    location: "Mysore",
    date: "15-16 February 2025",
    description: "Certificate of participation for the 24-hour INFOTHON 4.0 hackathon event.",
    fileName: "infothon-4-0-2025.pdf",
  },
  {
    title: "Nexovate’25",
    event: "National Level Hackathon",
    college: "Presidency University Bengaluru",
    location: "Bengaluru",
    date: "29-30 August 2025",
    description: "Certificate of participation for Nexovate’25 national level hackathon organized by Harvest Club.",
    fileName: "nexovate-25-2025.pdf",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const getCertificateUrl = (cert: Certificate) => {
  if (cert.fileUrl) return cert.fileUrl;
  if (cert.fileName) return `/certificates/${cert.fileName}`;
  return "/certificates/placeholder.pdf";
};

const loadLocalAchievements = async () => {
  const res = await fetch(ACHIEVEMENTS_CONFIG_URL);
  if (!res.ok) throw new Error("Local certificate config not found");
  return res.json() as Promise<Certificate[]>;
};

const CertificateModal = ({ isOpen, onClose, cert }: { isOpen: boolean; onClose: () => void; cert: Certificate | null }) => (
  <AnimatePresence>
    {isOpen && cert && (
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
        <motion.div
          className="relative glass-strong rounded-2xl p-8 max-w-2xl w-full border border-border/50"
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        >
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-lg glass flex items-center justify-center hover:bg-primary/20 transition-all text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>

          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-purple/30 to-neon-blue/10 flex items-center justify-center mx-auto">
              {(() => { const Icon = iconMap[cert.event] || Trophy; return <Icon className="text-foreground" size={28} />; })()}
            </div>

            <div>
              <h3 className="font-heading text-2xl font-bold text-foreground mb-2">{cert.event}</h3>
              <p className="text-primary font-medium">{cert.title}</p>
              <p className="text-muted-foreground text-sm mt-1">{cert.college}, {cert.location}</p>
              {cert.date && <p className="text-secondary-foreground text-sm mt-2">{cert.date}</p>}
            </div>

            {/* PDF Preview */}
            <div className="glass rounded-xl p-4">
              <iframe
                src={getCertificateUrl(cert)}
                className="w-full h-64 md:h-80 rounded-lg border border-border/30"
                title={`${cert.title} certificate`}
              />
            </div>

            <p className="text-secondary-foreground text-sm leading-relaxed">{cert.description}</p>

            <div className="flex gap-3 justify-center">
              <a
                href={getCertificateUrl(cert)}
                download
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm magnetic-btn relative overflow-hidden group inline-flex items-center gap-2"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Download size={14} />
                  Download Certificate
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-neon-purple to-neon-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </a>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const AchievementsSection = () => {
  const [certificates, setCertificates] = useState<Certificate[]>(fallbackCertificates);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Certificate | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
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

  const handleSliderClick = (direction: "left" | "right") => {
    const nextIndex = direction === "left" ? Math.max(activeIndex - 1, 0) : Math.min(activeIndex + 1, certificates.length - 1);
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
  }, [certificates]);

  useEffect(() => {
    if (isPaused || certificates.length <= 1) return;
    const interval = window.setInterval(() => {
      const nextIndex = activeIndex === certificates.length - 1 ? 0 : activeIndex + 1;
      scrollToIndex(nextIndex);
    }, 4500);
    return () => window.clearInterval(interval);
  }, [activeIndex, certificates.length, isPaused]);

  useEffect(() => {
    fetchCertificates()
      .then(async (data) => {
        if (data && data.length > 0) {
          setCertificates(data);
        } else {
          const localCerts = await loadLocalAchievements().catch(() => fallbackCertificates);
          setCertificates(localCerts);
        }
      })
      .catch(async () => {
        const localCerts = await loadLocalAchievements().catch(() => fallbackCertificates);
        setCertificates(localCerts);
      })
      .finally(() => setLoading(false));
  }, []);

  const openModal = (cert: Certificate) => {
    setSelected(cert);
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

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={() => handleSliderClick("left")}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow-xl shadow-background/30 ring-1 ring-border/50 hover:bg-background transition-opacity"
              aria-label="Scroll achievements left"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => handleSliderClick("right")}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow-xl shadow-background/30 ring-1 ring-border/50 hover:bg-background transition-opacity"
              aria-label="Scroll achievements right"
            >
              <ChevronRight size={20} />
            </button>
            <div className="overflow-hidden rounded-3xl" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
              <div
                ref={sliderRef}
                className="flex gap-6 px-6 py-4 snap-x snap-mandatory overflow-x-auto scroll-smooth scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary/30 scrollbar-thumb-rounded-full"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {certificates.map((cert, i) => {
                  const g = gradients[i % gradients.length];
                  const Icon = iconMap[cert.event] || Trophy;
                  return (
                    <motion.div
                      key={cert.title}
                      custom={i}
                      variants={cardVariants}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, margin: "-60px" }}
                      className="snap-start min-w-[300px] md:min-w-[340px] max-w-[340px] flex-none"
                    >
                      <motion.div
                        className="achievement-glass gradient-border rounded-2xl p-7 h-[430px] flex flex-col justify-between relative overflow-hidden group cursor-default"
                        whileHover={{ y: -6, scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      >
                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${g.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${g.iconGradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="text-foreground" size={24} />
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary/90 border border-primary/10 mb-4 w-fit">
                          {cert.event}
                        </span>
                        <h3 className="font-heading text-lg font-bold text-foreground mb-1">{cert.title}</h3>
                        <p className="text-muted-foreground text-xs mb-2">{cert.college}, {cert.location}</p>
                        {cert.date && <p className="text-secondary-foreground text-xs mb-4">{cert.date}</p>}
                        <p className="text-secondary-foreground text-sm leading-relaxed mb-6 flex-1">{cert.description}</p>

                        <div className="flex gap-3">
                          <motion.button onClick={() => openModal(cert)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl glass text-sm text-foreground hover:border-primary/40 transition-all group/btn" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                            <Eye size={14} className="text-muted-foreground group-hover/btn:text-primary transition-colors" />
                            View
                          </motion.button>
                          <motion.a href={getCertificateUrl(cert)} download className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-sm text-primary hover:bg-primary/20 transition-all border border-primary/10" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                            <Download size={14} />
                            Certificate
                          </motion.a>
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 flex justify-center gap-2">
              {certificates.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => scrollToIndex(index)}
                  className={`h-2.5 w-2.5 rounded-full transition-all ${index === activeIndex ? "bg-primary" : "bg-border/60 hover:bg-border"}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <CertificateModal isOpen={modalOpen} onClose={() => setModalOpen(false)} cert={selected} />
    </section>
  );
};

export default AchievementsSection;
