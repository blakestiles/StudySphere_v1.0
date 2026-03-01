"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";

interface FloatingParticlesProps {
  count?: number;
  className?: string;
}

export default function FloatingParticles({ count = 20, className = "" }: FloatingParticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    for (let i = 0; i < count; i++) {
      const particle = document.createElement("div");
      const size = Math.random() * 4 + 2;
      particle.className = "floating-p";
      particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: radial-gradient(circle, rgba(249,115,22,0.6), rgba(249,115,22,0));
        border-radius: 50%;
        top: ${Math.random() * 100}%;
        left: ${Math.random() * 100}%;
        opacity: 0;
      `;
      container.appendChild(particle);
    }

    const particles = container.querySelectorAll(".floating-p");
    particles.forEach((p) => {
      const duration = Math.random() * 4000 + 3000;
      const yMove = Math.random() * 80 - 40;
      const xMove = Math.random() * 60 - 30;

      animate(p, {
        translateY: [0, yMove],
        translateX: [0, xMove],
        opacity: [0, 0.8, 0],
        scale: [0.5, 1.2, 0.5],
        duration,
        loop: true,
        ease: "easeInOutSine",
        delay: Math.random() * 2000,
      });
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
