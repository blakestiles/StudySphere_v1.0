"use client";

import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";

interface StarsBackgroundProps {
  count?: number;
  className?: string;
}

export default function StarsBackground({ count = 80, className = "" }: StarsBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    for (let i = 0; i < count; i++) {
      const star = document.createElement("div");
      const size = Math.random() * 2.5 + 0.5;
      star.className = "star-particle";
      star.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: white;
        border-radius: 50%;
        top: ${Math.random() * 100}%;
        left: ${Math.random() * 100}%;
        opacity: 0;
      `;
      container.appendChild(star);
    }

    animate(".star-particle", {
      opacity: [0, () => Math.random() * 0.7 + 0.3],
      scale: [0, 1],
      delay: stagger(30, { from: "center" }),
      duration: 1500,
      loop: true,
      alternate: true,
      ease: "easeInOutSine",
    });

    return () => {
      container.innerHTML = "";
    };
  }, [count]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    />
  );
}
