import { motion } from "framer-motion";

const blobs = [
  { color: "bg-neon-purple/10", size: "w-[600px] h-[600px]", position: "top-0 left-1/4", delay: 0 },
  { color: "bg-neon-blue/8", size: "w-[500px] h-[500px]", position: "top-1/3 right-0", delay: 2 },
  { color: "bg-neon-cyan/5", size: "w-[400px] h-[400px]", position: "bottom-1/4 left-0", delay: 4 },
];

const AnimatedBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute inset-0 grid-bg opacity-30" />
    {blobs.map((blob, i) => (
      <motion.div
        key={i}
        className={`absolute ${blob.position} ${blob.size} ${blob.color} rounded-full blur-[120px]`}
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -50, 20, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          delay: blob.delay,
          ease: "easeInOut",
        }}
      />
    ))}
  </div>
);

export default AnimatedBackground;
