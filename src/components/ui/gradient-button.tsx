"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface GradientButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
  href?: string;
}

export function GradientButton({
  children,
  className,
  variant = "default",
  href,
  ...props
}: GradientButtonProps) {
  const filledClasses = cn(
    "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-white",
    "bg-[length:200%_auto] bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400",
    "bg-left hover:bg-right transition-all duration-500 ease-in-out",
    "shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 active:scale-[0.98]",
    className
  );

  const outlineClasses = cn(
    "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-white",
    "border border-transparent transition-all duration-300 active:scale-[0.98] hover:text-amber-200",
    className
  );

  if (variant === "outline") {
    const outlineStyle = {
      background:
        "linear-gradient(#08080F, #08080F) padding-box, linear-gradient(to right, #fbbf24, #f97316) border-box",
    } as React.CSSProperties;

    if (href) {
      return (
        <Link href={href} className={outlineClasses} style={outlineStyle}>
          {children}
        </Link>
      );
    }
    return (
      <button {...props} className={outlineClasses} style={outlineStyle}>
        {children}
      </button>
    );
  }

  if (href) {
    return (
      <Link href={href} className={filledClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button className={filledClasses} {...props}>
      {children}
    </button>
  );
}

export default GradientButton;
