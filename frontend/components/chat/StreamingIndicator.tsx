import * as React from "react";
import { motion } from "framer-motion";

export const StreamingIndicator = () => {
  const dotVariants = {
    initial: { opacity: 0.2, y: 0 },
    animate: { opacity: 1, y: -4 },
  };

  const transition = {
    duration: 0.5,
    repeat: Infinity,
    repeatType: "reverse" as const,
    ease: "easeInOut" as const,
  };

  return (
    <div className="flex items-center space-x-1.5 p-3 rounded-2xl bg-white/5 w-fit rounded-tl-none border border-white/5">
      <motion.div
        className="w-2 h-2 rounded-full bg-white/40"
        variants={dotVariants}
        initial="initial"
        animate="animate"
        transition={{ ...transition, delay: 0 }}
      />
      <motion.div
        className="w-2 h-2 rounded-full bg-white/40"
        variants={dotVariants}
        initial="initial"
        animate="animate"
        transition={{ ...transition, delay: 0.15 }}
      />
      <motion.div
        className="w-2 h-2 rounded-full bg-white/40"
        variants={dotVariants}
        initial="initial"
        animate="animate"
        transition={{ ...transition, delay: 0.3 }}
      />
    </div>
  );
};
