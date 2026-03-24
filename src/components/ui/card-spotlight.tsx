"use client";

import { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface CardSpotlightProps {
  children: React.ReactNode;
  className?: string;
  radius?: number;
  color?: string;
}

export function CardSpotlight({
  children,
  className,
  radius = 320,
  color = "rgba(245,158,11,0.08)",
}: CardSpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c16] p-6 transition-[border-color] duration-300 group",
        isHovering && "border-amber-500/20",
        className
      )}
      style={{
        background: isHovering
          ? `radial-gradient(${radius}px circle at ${mousePos.x}px ${mousePos.y}px, ${color}, transparent 80%), #0c0c16`
          : "#0c0c16",
      }}
    >
      {children}
    </div>
  );
}

export default CardSpotlight;
