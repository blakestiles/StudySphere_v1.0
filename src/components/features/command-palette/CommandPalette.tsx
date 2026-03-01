"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";

const pages = [
  { name: "Dashboard", href: "/dashboard", icon: "📊" },
  { name: "Upload", href: "/upload", icon: "📤" },
  { name: "Documents", href: "/documents", icon: "📖" },
  { name: "Study Packs", href: "/study-packs", icon: "📚" },
  { name: "Focus Mode", href: "/focus", icon: "🎯" },
  { name: "Calendar", href: "/calendar", icon: "📅" },
  { name: "Analytics", href: "/analytics", icon: "📈" },
  { name: "Practice Essay", href: "/practice-essay", icon: "✍️" },
  { name: "AI Tutor", href: "/chat", icon: "🤖" },
  { name: "Study Plan", href: "/study-plan", icon: "🗓️" },
  { name: "Knowledge Graph", href: "/knowledge-graph", icon: "🧠" },
  { name: "History", href: "/history", icon: "📜" },
  { name: "Profile", href: "/profile", icon: "👤" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleOpen = useCallback(() => setOpen(true), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleOpen);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleOpen);
    };
  }, [handleOpen]);

  const navigateTo = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => setOpen(false)}
      />

      {/* Command dialog */}
      <div className="fixed top-[20%] left-1/2 z-[101] w-full max-w-lg -translate-x-1/2">
        <Command
          className="rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl overflow-hidden"
          label="Command palette"
        >
          <Command.Input
            placeholder="Search pages..."
            className="w-full border-b border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>
            <Command.Group heading="Pages" className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              {pages.map((page) => (
                <Command.Item
                  key={page.href}
                  value={page.name}
                  onSelect={() => navigateTo(page.href)}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm text-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                >
                  <span className="text-base">{page.icon}</span>
                  <span>{page.name}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
