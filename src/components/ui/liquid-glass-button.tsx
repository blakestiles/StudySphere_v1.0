"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface LiquidGlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
}

export function LiquidGlassButton({
  children,
  className,
  href,
  ...props
}: LiquidGlassButtonProps) {
  const classes = cn(
    "group relative inline-flex items-center justify-center gap-2 overflow-hidden",
    "rounded-2xl px-5 py-2.5 text-sm font-semibold text-white/80",
    // glass base
    "bg-white/[0.05] backdrop-blur-md",
    "border border-white/[0.10]",
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_16px_rgba(0,0,0,0.20)]",
    // hover
    "hover:bg-white/[0.09] hover:border-amber-500/25 hover:text-white",
    "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_6px_24px_rgba(251,191,36,0.10)]",
    "transition-all duration-300 active:scale-[0.97]",
    className
  );

  const inner = (
    <>
      {/* Amber tint layer */}
      <span className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.10] via-transparent to-orange-500/[0.05] transition-opacity duration-300 group-hover:opacity-150" />
      {/* Top highlight */}
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/25 to-transparent" />
      {/* Bottom shadow line */}
      <span className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-black/20 to-transparent" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {inner}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {inner}
    </button>
  );
}

export default LiquidGlassButton;
