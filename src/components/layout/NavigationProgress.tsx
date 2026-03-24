"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const prevPathname = useRef(pathname);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  // Detect link clicks and show the bar immediately
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || href === pathname) return;

      // Show instantly
      setVisible(true);
      setWidth(15);

      // Trickle to 80%
      let current = 15;
      const trickle = () => {
        current = Math.min(current + Math.random() * 12, 80);
        setWidth(current);
        if (current < 80) rafRef.current = requestAnimationFrame(trickle);
      };
      timerRef.current = setTimeout(() => {
        rafRef.current = requestAnimationFrame(trickle);
      }, 120);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pathname]);

  // Complete the bar when pathname changes (navigation finished)
  useEffect(() => {
    if (pathname === prevPathname.current) return;
    prevPathname.current = pathname;

    if (timerRef.current) clearTimeout(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    setWidth(100);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 300);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-[2px] pointer-events-none"
      style={{
        width: `${width}%`,
        transition: width === 100 ? "width 150ms ease-out" : "width 400ms ease-out",
        background: "linear-gradient(90deg, #f59e0b, #f97316)",
        boxShadow: "0 0 8px #f97316aa",
      }}
    />
  );
}
