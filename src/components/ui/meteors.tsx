"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface MeteorsProps {
  count?: number;
  className?: string;
}

interface Meteor {
  id: number;
  left: string;
  delay: string;
  duration: string;
  size: string;
}

export default function Meteors({ count = 20, className }: MeteorsProps) {
  const [meteors, setMeteors] = useState<Meteor[]>([]);

  useEffect(() => {
    setMeteors(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 5}s`,
        duration: `${1.5 + Math.random() * 3}s`,
        size: `${1 + Math.random() * 1.5}px`,
      }))
    );
  }, [count]);

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {meteors.map((m) => (
        <span
          key={m.id}
          className="absolute animate-meteor"
          style={{
            top: "-5%",
            left: m.left,
            animationDelay: m.delay,
            animationDuration: m.duration,
            width: m.size,
            height: m.size,
          }}
        >
          <span
            className="absolute inline-block rounded-full bg-amber-400 shadow-[0_0_6px_2px_rgba(251,191,36,0.3)]"
            style={{ width: m.size, height: m.size }}
          />
          <span
            className="absolute top-1/2 -translate-y-1/2 w-[60px] h-px"
            style={{
              background: "linear-gradient(90deg, rgba(251,191,36,0.6), transparent)",
              right: "100%",
              transform: "translateY(-50%) rotate(0deg)",
            }}
          />
        </span>
      ))}
      <style jsx>{`
        @keyframes meteor-fall {
          0% {
            transform: translateY(0) translateX(0) rotate(215deg);
            opacity: 1;
          }
          70% { opacity: 1; }
          100% {
            transform: translateY(600px) translateX(-300px) rotate(215deg);
            opacity: 0;
          }
        }
        .animate-meteor {
          animation: meteor-fall var(--duration, 3s) linear var(--delay, 0s) infinite;
          transform: rotate(215deg);
        }
      `}</style>
    </div>
  );
}
