"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { cn } from "@/lib/utils";

interface TextGenerateEffectProps {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
}

export function TextGenerateEffect({
  words,
  className,
  filter = true,
  duration = 0.5,
}: TextGenerateEffectProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const wordsArray = words.split(" ");

  return (
    <div ref={ref} className={cn("font-display font-bold", className)}>
      <div className="leading-snug tracking-tight">
        {wordsArray.map((word, idx) => (
          <motion.span
            key={word + idx}
            initial={{
              opacity: 0,
              filter: filter ? "blur(10px)" : "none",
            }}
            animate={isInView ? {
              opacity: 1,
              filter: filter ? "blur(0px)" : "none",
            } : {}}
            transition={{
              duration: duration,
              delay: idx * 0.08,
              ease: [0.25, 0.4, 0.25, 1],
            }}
            className="inline-block mr-[0.3em] text-white/90"
          >
            {word}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

export default TextGenerateEffect;
