"use client";

import { useEffect, useRef } from "react";
import { useInView } from "motion/react";
import { animate, stagger } from "animejs";

interface TextRevealProps {
  text: string;
  className?: string;
  highlightWords?: string[];
  highlightClass?: string;
  delay?: number;
}

export default function TextReveal({
  text,
  className = "",
  highlightWords = [],
  highlightClass = "text-orange-500",
  delay = 0,
}: TextRevealProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current || !containerRef.current) return;
    hasAnimated.current = true;

    const words = text.split(" ");
    containerRef.current.innerHTML = words
      .map((word) => {
        const isHighlight = highlightWords.some(
          (hw) => word.toLowerCase().includes(hw.toLowerCase())
        );
        return `<span class="inline-block overflow-hidden"><span class="text-reveal-word inline-block translate-y-full ${isHighlight ? highlightClass : ""}">${word}</span></span>`;
      })
      .join('<span class="inline-block">&nbsp;</span>');

    animate(".text-reveal-word", {
      translateY: ["100%", "0%"],
      opacity: [0, 1],
      delay: stagger(60, { start: delay }),
      duration: 700,
      ease: "easeOutCubic",
    });
  }, [isInView, text, highlightWords, highlightClass, delay]);

  return (
    <span ref={containerRef} className={`inline ${className}`}>
      {text}
    </span>
  );
}
