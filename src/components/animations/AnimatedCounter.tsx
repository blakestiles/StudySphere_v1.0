"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { animate } from "animejs";

interface AnimatedCounterProps {
  value: string;
  className?: string;
}

export default function AnimatedCounter({ value, className = "" }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [displayed, setDisplayed] = useState(value);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const numericMatch = value.match(/^([\d.]+)/);
    if (!numericMatch) {
      setDisplayed(value);
      return;
    }

    const target = parseFloat(numericMatch[1]);
    const suffix = value.slice(numericMatch[1].length);
    const isDecimal = numericMatch[1].includes(".");
    const obj = { val: 0 };

    animate(obj, {
      val: target,
      duration: 1800,
      ease: "easeOutExpo",
      onUpdate: () => {
        const formatted = isDecimal ? obj.val.toFixed(1) : Math.round(obj.val).toString();
        setDisplayed(formatted + suffix);
      },
    });
  }, [isInView, value]);

  return (
    <span ref={ref} className={className}>
      {displayed}
    </span>
  );
}
