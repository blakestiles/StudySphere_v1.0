"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

interface AnimatedGridPatternProps {
  className?: string;
  width?: number;
  height?: number;
  numSquares?: number;
  maxOpacity?: number;
  duration?: number;
  strokeColor?: string;
  fillColor?: string;
}

export default function AnimatedGridPattern({
  className,
  width = 40,
  height = 40,
  numSquares = 30,
  maxOpacity = 0.3,
  duration = 3,
  strokeColor = "rgba(251,191,36,0.08)",
  fillColor = "rgba(251,191,36,0.06)",
}: AnimatedGridPatternProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ cols: 0, rows: 0 });
  const [activeSquares, setActiveSquares] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDimensions({
      cols: Math.ceil(rect.width / width),
      rows: Math.ceil(rect.height / height),
    });
  }, [width, height]);

  const getRandomSquares = useCallback(() => {
    const squares = new Set<string>();
    const total = dimensions.cols * dimensions.rows;
    if (total === 0) return squares;
    const count = Math.min(numSquares, total);
    while (squares.size < count) {
      const col = Math.floor(Math.random() * dimensions.cols);
      const row = Math.floor(Math.random() * dimensions.rows);
      squares.add(`${col}-${row}`);
    }
    return squares;
  }, [dimensions.cols, dimensions.rows, numSquares]);

  useEffect(() => {
    if (dimensions.cols === 0 || dimensions.rows === 0) return;
    setActiveSquares(getRandomSquares());
    const interval = setInterval(() => {
      setActiveSquares(getRandomSquares());
    }, duration * 1000);
    return () => clearInterval(interval);
  }, [dimensions, duration, getRandomSquares]);

  return (
    <div
      ref={containerRef}
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <pattern
            id="grid-pattern"
            width={width}
            height={height}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${width} 0 L 0 0 0 ${height}`}
              fill="none"
              stroke={strokeColor}
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        {Array.from(activeSquares).map((key) => {
          const [col, row] = key.split("-").map(Number);
          return (
            <rect
              key={key}
              x={col * width + 1}
              y={row * height + 1}
              width={width - 2}
              height={height - 2}
              fill={fillColor}
              rx="2"
              style={{
                opacity: maxOpacity,
                animation: `grid-fade ${duration}s ease-in-out`,
              }}
            />
          );
        })}
      </svg>
      <style jsx>{`
        @keyframes grid-fade {
          0%, 100% { opacity: 0; }
          50% { opacity: ${maxOpacity}; }
        }
      `}</style>
    </div>
  );
}
