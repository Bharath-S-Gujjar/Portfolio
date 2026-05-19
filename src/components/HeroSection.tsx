import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import profileImg from "@/assets/profile.jpg";

const HeroSection = () => {
  const imgRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -12, y: x * 12 });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
      <div className="container relative z-10 mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div className="space-y-6">
            <motion.p
              className="text-muted-foreground text-lg tracking-wider uppercase"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Hey👋, I'm a Full Stack Developer
            </motion.p>

            <motion.h1
              className="font-heading text-6xl md:text-8xl font-bold leading-[0.9] tracking-tight"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.7 }}
            >
              <span className="gradient-text neon-text">BHARATH</span>
              <br />
              <span className="text-foreground">S GUJJAR</span>
            </motion.h1>

            <motion.p
              className="text-muted-foreground text-xs tracking-[0.3em] uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              ©2025 — Portfolio
            </motion.p>

            <motion.p
              className="text-secondary-foreground max-w-md leading-relaxed text-base"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              I build fast, scalable, and user-friendly web applications using modern Java technologies.
              My main tools of choice are Spring Boot on the backend and React on the frontend.
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-4 pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <a
                href="/cv.pdf"
                target="_blank"
                rel="noreferrer"
                className="px-7 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold magnetic-btn relative overflow-hidden group"
              >
                <span className="relative z-10">View CV</span>
                <div className="absolute inset-0 bg-gradient-to-r from-neon-purple to-neon-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </a>
              <a
                href="#contact"
                className="px-7 py-3.5 rounded-xl glass text-foreground font-semibold hover:border-primary/50 transition-all magnetic-btn"
              >
                Contact Me
              </a>
            </motion.div>
          </div>

          {/* Cinematic Profile Image */}
          <motion.div
            className="relative flex justify-center lg:justify-end"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
          >
            <div
              ref={imgRef}
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="relative w-80 h-96 md:w-96 md:h-[480px] cursor-pointer"
              style={{ perspective: "1200px" }}
            >
              <motion.div
                className="relative w-full h-full"
                animate={{
                  rotateX: tilt.x,
                  rotateY: tilt.y,
                }}
                transition={{
                  rotateX: { type: "spring", stiffness: 150, damping: 25 },
                  rotateY: { type: "spring", stiffness: 150, damping: 25 },
                }}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Floating animation wrapper */}
                <motion.div
                  className="relative w-full h-full"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                >
                  {/* Depth shadow behind subject */}
                  <div className="absolute inset-4 rounded-2xl bg-gradient-to-br from-neon-purple/40 via-neon-blue/30 to-neon-cyan/20 blur-[40px] scale-105" />

                  {/* Neon rim lighting - blue edge */}
                  <motion.div
                    className="absolute -inset-1 rounded-2xl"
                    style={{
                      background: "linear-gradient(135deg, hsl(220 100% 60% / 0.6), hsl(250 90% 65% / 0.4), hsl(190 100% 55% / 0.5))",
                      filter: "blur(12px)",
                    }}
                    animate={{
                      opacity: isHovered ? 0.9 : 0.5,
                    }}
                    transition={{ duration: 0.4 }}
                  />

                  {/* Main image container */}
                  <div className="relative w-full h-full rounded-2xl overflow-hidden">
                    {/* The profile image */}
                    <img
                      src={profileImg}
                      alt="Bharath S Gujjar"
                      className="relative w-full h-full object-cover"
                      style={{
                        filter: "contrast(1.1) saturate(1.1) brightness(1.05)",
                      }}
                      width={800}
                      height={1000}
                    />

                    {/* Vignette overlay */}
                    <div
                      className="absolute inset-0"
                      style={{
                        boxShadow: "inset 0 0 80px 20px hsl(230 25% 4% / 0.5)",
                      }}
                    />

                    {/* Bottom gradient fade */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />

                    {/* Top subtle gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-transparent" />

                    {/* Film grain overlay */}
                    <div
                      className="absolute inset-0 opacity-[0.06] mix-blend-overlay pointer-events-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
                      }}
                    />

                    {/* Neon edge highlights */}
                    <div
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{
                        boxShadow: `
                          inset 2px 0 12px hsl(220 100% 60% / 0.3),
                          inset -2px 0 12px hsl(250 90% 65% / 0.3),
                          inset 0 2px 12px hsl(190 100% 55% / 0.2),
                          inset 0 -2px 12px hsl(250 90% 65% / 0.2)
                        `,
                      }}
                    />
                  </div>

                  {/* Hover glow intensifier */}
                  <motion.div
                    className="absolute -inset-2 rounded-2xl pointer-events-none"
                    style={{
                      background: "radial-gradient(circle at 50% 50%, hsl(250 90% 65% / 0.15), transparent 70%)",
                    }}
                    animate={{
                      opacity: isHovered ? 1 : 0,
                      scale: isHovered ? 1.05 : 1,
                    }}
                    transition={{ duration: 0.5 }}
                  />

                  {/* Border glow */}
                  <div className="absolute inset-0 rounded-2xl border border-primary/20 pointer-events-none" />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <motion.div
          className="flex flex-wrap justify-between items-center mt-16 pt-8 border-t border-border/50 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <div className="space-y-1">
            <p className="flex items-center gap-2">
              <span className="text-primary">E</span> bharathsgujjar634@gmail.com
            </p>
            <p className="flex items-center gap-2">
              <span className="text-primary">T</span> +91 7022441738
            </p>
          </div>
          <div className="flex gap-6">
            {["LinkedIn", "GitHub", "LeetCode"].map((label) => (
              <a key={label} href={`https://${label.toLowerCase()}.com`} className="hover:text-primary transition-colors group">
                <span className="text-muted-foreground group-hover:text-primary">/ </span>{label}
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
