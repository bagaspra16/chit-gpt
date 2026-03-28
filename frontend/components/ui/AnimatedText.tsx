"use client"

import * as React from "react"
import { motion } from "framer-motion"

interface AnimatedTextProps {
  text: string;
  isStreaming?: boolean;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({ text, isStreaming = false }) => {
  // If we aren't streaming, just render the text normally (HTML structure).
  // If streaming but text is long, let's just render the text directly to avoid Framer overload
  if (!isStreaming || text.length > 500) {
    return <span className="whitespace-pre-wrap leading-relaxed">{text}</span>;
  }

  // When actively streaming smaller chunks, use a layout animation approach
  return (
    <motion.span 
      layout="position"
      className="whitespace-pre-wrap leading-relaxed inline-block"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.1 }}
    >
      {text}
      {isStreaming && (
        <span className="inline-block w-2 bg-white/40 h-4 ml-1 animate-pulse align-middle" />
      )}
    </motion.span>
  )
}
