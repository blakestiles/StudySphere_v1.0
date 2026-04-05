"use client";

import { useMemo } from "react";
import katex from "katex";

type Segment =
  | { type: "text"; content: string }
  | { type: "block"; content: string }
  | { type: "inline"; content: string };

function parseSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  // Match $$...$$ (block) or $...$ (inline) — block first so $$ isn't consumed as two $
  const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ type: "text", content: text.slice(last, match.index) });
    }
    if (match[1] !== undefined) {
      segments.push({ type: "block", content: match[1] });
    } else {
      segments.push({ type: "inline", content: match[2] });
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    segments.push({ type: "text", content: text.slice(last) });
  }

  return segments;
}

function renderKatex(latex: string, display: boolean): string {
  try {
    return katex.renderToString(latex, { displayMode: display, throwOnError: false, output: "html" });
  } catch {
    return latex;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildHtml(text: string): string {
  return parseSegments(text)
    .map((seg) => {
      if (seg.type === "block") return `<span class="katex-block">${renderKatex(seg.content, true)}</span>`;
      if (seg.type === "inline") return renderKatex(seg.content, false);
      return escapeHtml(seg.content);
    })
    .join("");
}

/**
 * Renders a string that may contain LaTeX math delimited by $...$ (inline)
 * or $$...$$ (block display). Plain text is HTML-escaped.
 */
export default function MathText({ text, className }: { text: string; className?: string }) {
  const html = useMemo(() => buildHtml(text), [text]);
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
