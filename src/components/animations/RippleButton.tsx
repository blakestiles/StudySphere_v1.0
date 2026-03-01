"use client";

import { useRef, type ReactNode, type MouseEvent, type ComponentProps } from "react";
import { motion } from "motion/react";
import { animate } from "animejs";
import { cn } from "@/lib/utils";

interface RippleButtonProps extends Omit<ComponentProps<typeof motion.button>, "children"> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export default function RippleButton({
  children,
  variant = "primary",
  size = "md",
  className,
  onClick,
  ...props
}: RippleButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const ripple = document.createElement("span");
    const diameter = Math.max(rect.width, rect.height);
    ripple.style.cssText = `
      position: absolute;
      width: ${diameter}px;
      height: ${diameter}px;
      left: ${e.clientX - rect.left - diameter / 2}px;
      top: ${e.clientY - rect.top - diameter / 2}px;
      border-radius: 50%;
      background: rgba(255,255,255,0.3);
      pointer-events: none;
      transform: scale(0);
    `;
    button.appendChild(ripple);

    animate(ripple, {
      scale: [0, 2.5],
      opacity: [0.6, 0],
      duration: 600,
      ease: "easeOutQuad",
      onComplete: () => ripple.remove(),
    });

    onClick?.(e);
  };

  const variants = {
    primary: "bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/25",
    secondary: "bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20",
    ghost: "text-muted-foreground hover:text-foreground hover:bg-muted",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <motion.button
      ref={buttonRef}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative overflow-hidden rounded-full font-medium transition-colors cursor-pointer inline-flex items-center gap-2",
        variants[variant],
        sizes[size],
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </motion.button>
  );
}
