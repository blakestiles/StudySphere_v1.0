"use client";

import React, { useRef } from "react";
import { motion, useInView, type Variants } from "motion/react";
import { cn } from "@/lib/utils";

interface FeatureHighlightProps {
  icon?: React.ReactNode;
  title: string;
  features: React.ReactNode[];
  footer?: React.ReactNode;
  className?: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 25, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

function FeatureHighlight({ className, icon, title, features, footer }: FeatureHighlightProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { once: true, margin: "-80px" });

    return (
      <motion.div
        ref={containerRef}
        className={cn(
          "flex max-w-2xl flex-col items-start space-y-5 text-left",
          className
        )}
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        {icon && <motion.div variants={itemVariants}>{icon}</motion.div>}

        <motion.h2
          variants={itemVariants}
          className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white"
        >
          {title}
        </motion.h2>

        <div className="flex flex-col space-y-2">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="text-xl sm:text-2xl text-white/40 leading-relaxed"
            >
              {feature}
            </motion.div>
          ))}
        </div>

        {footer && (
          <motion.div variants={itemVariants} className="pt-2">
            {footer}
          </motion.div>
        )}
      </motion.div>
    );
}

export { FeatureHighlight };
export default FeatureHighlight;
