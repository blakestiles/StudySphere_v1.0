"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface SlideButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
}

export function SlideButton({
  children,
  className,
  href,
  ...props
}: SlideButtonProps) {
  const classes = cn(
    "group relative inline-flex items-center gap-2 overflow-hidden",
    "rounded-xl border border-amber-500/20 bg-amber-500/[0.03]",
    "px-4 py-2 text-sm font-medium text-white/70",
    "transition-colors duration-300",
    className
  );

  const inner = (
    <>
      {/* Slide fill */}
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-amber-500 to-orange-500 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:translate-x-0" />
      <span className="relative z-10 flex items-center gap-2 transition-colors duration-150 group-hover:text-white">
        {children}
      </span>
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

export default SlideButton;
