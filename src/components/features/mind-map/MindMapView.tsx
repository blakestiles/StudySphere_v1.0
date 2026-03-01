"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";

interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
}

interface MindMapViewProps {
  mindMap: MindMapNode;
  title: string;
}

// ── Colors per depth ───────────────────────────────────

const DEPTH_COLORS = [
  { accent: "#f97316", text: "#fdba74", dot: "#f97316", border: "#f97316" },   // orange - root
  { accent: "#60a5fa", text: "#93c5fd", dot: "#60a5fa", border: "#3b82f6" },   // blue
  { accent: "#4ade80", text: "#86efac", dot: "#4ade80", border: "#22c55e" },   // green
  { accent: "#c084fc", text: "#d8b4fe", dot: "#c084fc", border: "#a855f7" },   // purple
  { accent: "#fb923c", text: "#fdba74", dot: "#fb923c", border: "#f97316" },   // orange
  { accent: "#f472b6", text: "#f9a8d4", dot: "#f472b6", border: "#ec4899" },   // pink
  { accent: "#22d3ee", text: "#67e8f9", dot: "#22d3ee", border: "#06b6d4" },   // cyan
];

function getColor(depth: number) {
  return DEPTH_COLORS[Math.min(depth, DEPTH_COLORS.length - 1)];
}

// ── Tree View (Text Outline) ───────────────────────────

function TreeOutlineNode({
  node,
  depth,
  searchQuery,
}: {
  node: MindMapNode;
  depth: number;
  searchQuery: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const color = getColor(depth);
  const hasChildren = node.children && node.children.length > 0;
  const isRoot = depth === 0;

  // Highlight matching text
  const matchesSearch =
    searchQuery && node.label.toLowerCase().includes(searchQuery.toLowerCase());

  return (
    <div style={{ paddingLeft: isRoot ? 0 : 20 }}>
      <div
        className="group flex items-start gap-2 py-1"
        style={{ cursor: hasChildren ? "pointer" : "default" }}
        onClick={() => hasChildren && setCollapsed((p) => !p)}
      >
        {/* Collapse indicator / bullet */}
        {hasChildren ? (
          <span
            className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center text-xs transition-transform"
            style={{
              color: color.accent,
              transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
            }}
          >
            &#9660;
          </span>
        ) : (
          <span
            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: color.dot }}
          />
        )}

        {/* Label */}
        <span
          className={`text-sm leading-relaxed ${isRoot ? "font-semibold" : "font-normal"}`}
          style={{
            color: matchesSearch ? "#fbbf24" : isRoot ? color.text : "var(--foreground)",
            backgroundColor: matchesSearch ? "rgba(251,191,36,0.1)" : undefined,
            borderRadius: matchesSearch ? 4 : undefined,
            padding: matchesSearch ? "0 4px" : undefined,
          }}
        >
          {node.label}
        </span>
      </div>

      {hasChildren && !collapsed && (
        <div
          className="ml-2 border-l"
          style={{ borderColor: `${color.accent}20` }}
        >
          {node.children!.map((child) => (
            <TreeOutlineNode
              key={child.id}
              node={child}
              depth={depth + 1}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Flowchart (Canvas, Horizontal L→R) ─────────────────

interface LayoutNode {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  children: LayoutNode[];
}

function measureLabel(text: string, fontSize: number): number {
  return Math.max(100, Math.min(220, text.length * fontSize * 0.55 + 32));
}

function layoutHorizontal(
  node: MindMapNode,
  depth: number = 0
): { layout: LayoutNode; height: number } {
  const fontSize = depth === 0 ? 13 : 11;
  const nodeW = measureLabel(node.label, fontSize);
  const nodeH = depth === 0 ? 40 : 34;
  const hGap = 60;
  const vGap = 14;

  if (!node.children || node.children.length === 0) {
    return {
      layout: {
        id: node.id,
        label: node.label,
        x: depth * (nodeW + hGap),
        y: 0,
        width: nodeW,
        height: nodeH,
        depth,
        children: [],
      },
      height: nodeH,
    };
  }

  const childLayouts = node.children.map((child) =>
    layoutHorizontal(child, depth + 1)
  );
  const totalChildH =
    childLayouts.reduce((s, c) => s + c.height, 0) +
    vGap * (childLayouts.length - 1);
  const selfH = Math.max(nodeH, totalChildH);

  let offsetY = -totalChildH / 2;
  const layoutChildren: LayoutNode[] = [];

  for (const { layout, height } of childLayouts) {
    layout.y = offsetY + height / 2;
    // Shift all sub-children by the same offset
    shiftY(layout, offsetY + height / 2 - layout.y);
    layoutChildren.push(layout);
    offsetY += height + vGap;
  }

  // Find x position: all children at same depth band
  const childX = (depth + 1) * (measureLabel("", fontSize) + hGap);

  // Recompute x for all children to use proper width-based positioning
  recomputeX(layoutChildren, depth + 1, hGap);

  return {
    layout: {
      id: node.id,
      label: node.label,
      x: 0,
      y: 0,
      width: nodeW,
      height: nodeH,
      depth,
      children: layoutChildren,
    },
    height: selfH,
  };
}

function recomputeX(nodes: LayoutNode[], depth: number, hGap: number) {
  for (const n of nodes) {
    const parentRight = getMaxXAtDepth(n, depth - 1);
    // position based on depth
    n.x = depth * (180 + hGap);
    recomputeX(n.children, depth + 1, hGap);
  }
}

function getMaxXAtDepth(node: LayoutNode, depth: number): number {
  return depth * (180 + 60);
}

function shiftY(node: LayoutNode, dy: number) {
  // y is already relative, no shift needed for children
}

function getBoundsH(node: LayoutNode): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  let minX = node.x;
  let maxX = node.x + node.width;
  let minY = node.y - node.height / 2;
  let maxY = node.y + node.height / 2;
  for (const child of node.children) {
    const b = getBoundsH(child);
    minX = Math.min(minX, b.minX);
    maxX = Math.max(maxX, b.maxX);
    minY = Math.min(minY, b.minY);
    maxY = Math.max(maxY, b.maxY);
  }
  return { minX, maxX, minY, maxY };
}

// Better horizontal layout: uses recursive y-centering
function layoutH(
  node: MindMapNode,
  depth: number,
  xOffset: number
): { layout: LayoutNode; totalHeight: number } {
  const fontSize = depth === 0 ? 13 : 11;
  const nodeW = measureLabel(node.label, fontSize);
  const nodeH = depth === 0 ? 42 : 34;
  const hGap = 50;
  const vGap = 12;

  if (!node.children || node.children.length === 0) {
    return {
      layout: {
        id: node.id, label: node.label,
        x: xOffset, y: 0, width: nodeW, height: nodeH, depth, children: [],
      },
      totalHeight: nodeH,
    };
  }

  const childResults = node.children.map((c) =>
    layoutH(c, depth + 1, xOffset + nodeW + hGap)
  );
  const totalChildH =
    childResults.reduce((s, r) => s + r.totalHeight, 0) +
    vGap * (childResults.length - 1);

  // Position children vertically centered
  let cy = -totalChildH / 2;
  for (const r of childResults) {
    offsetNodeY(r.layout, cy + r.totalHeight / 2);
    cy += r.totalHeight + vGap;
  }

  return {
    layout: {
      id: node.id, label: node.label,
      x: xOffset, y: 0, width: nodeW, height: nodeH, depth,
      children: childResults.map((r) => r.layout),
    },
    totalHeight: Math.max(nodeH, totalChildH),
  };
}

function offsetNodeY(node: LayoutNode, dy: number) {
  node.y += dy;
  for (const c of node.children) offsetNodeY(c, 0);
}

// Flatten to get bounds
function collectNodes(node: LayoutNode, out: LayoutNode[] = []): LayoutNode[] {
  out.push(node);
  for (const c of node.children) collectNodes(c, out);
  return out;
}

// ── Canvas Draw Functions ──────────────────────────────

function hexToRgba(hex: string, a: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawFlowchartEdges(ctx: CanvasRenderingContext2D, node: LayoutNode) {
  for (const child of node.children) {
    const color = getColor(child.depth);
    const startX = node.x + node.width;
    const startY = node.y;
    const endX = child.x;
    const endY = child.y;
    const midX = startX + (endX - startX) * 0.5;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(midX, startY, midX, endY, endX, endY);
    ctx.strokeStyle = hexToRgba(color.border, 0.35);
    ctx.lineWidth = 1.8;
    ctx.stroke();

    drawFlowchartEdges(ctx, child);
  }
}

function drawFlowchartNodes(ctx: CanvasRenderingContext2D, node: LayoutNode) {
  const color = getColor(node.depth);
  const isRoot = node.depth === 0;
  const x = node.x;
  const y = node.y - node.height / 2;
  const w = node.width;
  const h = node.height;
  const r = 8;

  // Shadow/glow
  ctx.save();
  ctx.shadowColor = hexToRgba(color.border, 0.2);
  ctx.shadowBlur = isRoot ? 16 : 8;

  // Fill
  drawRoundedRect(ctx, x, y, w, h, r);
  if (isRoot) {
    ctx.fillStyle = hexToRgba(color.border, 0.85);
  } else {
    ctx.fillStyle = "rgba(15,23,42,0.85)";
  }
  ctx.fill();

  // Border
  ctx.strokeStyle = hexToRgba(color.border, isRoot ? 0.9 : 0.4);
  ctx.lineWidth = isRoot ? 2 : 1.2;
  ctx.stroke();
  ctx.restore();

  // Label
  const fontSize = isRoot ? 13 : 11;
  ctx.font = `${isRoot ? 600 : 400} ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = isRoot ? "#fff" : color.text;

  const maxChars = Math.floor((w - 20) / (fontSize * 0.55));
  const label =
    node.label.length > maxChars
      ? node.label.slice(0, maxChars - 2) + "..."
      : node.label;
  ctx.fillText(label, x + 12, node.y + 1);

  for (const child of node.children) {
    drawFlowchartNodes(ctx, child);
  }
}

// ── Main Component ─────────────────────────────────────

export default function MindMapView({ mindMap, title }: MindMapViewProps) {
  const [viewMode, setViewMode] = useState<"tree" | "flowchart">("tree");
  const [searchQuery, setSearchQuery] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const animRef = useRef<number>(0);
  const needsRedraw = useRef(true);
  const dragNodeRef = useRef<LayoutNode | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const flowNodesRef = useRef<LayoutNode[]>([]);

  // Layout for flowchart
  const flowResult = useMemo(() => layoutH(mindMap, 0, 0), [mindMap]);
  const flowNodes = useMemo(() => {
    const nodes = collectNodes(flowResult.layout);
    flowNodesRef.current = nodes;
    return nodes;
  }, [flowResult]);
  const flowBounds = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of flowNodes) {
      minX = Math.min(minX, n.x);
      maxX = Math.max(maxX, n.x + n.width);
      minY = Math.min(minY, n.y - n.height / 2);
      maxY = Math.max(maxY, n.y + n.height / 2);
    }
    return { minX, maxX, minY, maxY };
  }, [flowNodes]);

  // Center flowchart on mount/mode switch
  useEffect(() => {
    if (viewMode !== "flowchart") return;
    const container = containerRef.current;
    if (!container) return;
    const cw = container.clientWidth;
    const ch = 500;
    const tw = flowBounds.maxX - flowBounds.minX + 100;
    const th = flowBounds.maxY - flowBounds.minY + 100;
    const scale = Math.min(cw / tw, ch / th, 1);
    const cx = (flowBounds.minX + flowBounds.maxX) / 2;
    const cy = (flowBounds.minY + flowBounds.maxY) / 2;
    transformRef.current = {
      x: cw / 2 - cx * scale,
      y: ch / 2 - cy * scale,
      scale,
    };
    needsRedraw.current = true;
  }, [viewMode, flowBounds]);

  // Canvas render loop for flowchart
  useEffect(() => {
    if (viewMode !== "flowchart") return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      if (!canvas || !container) return;
      const dpr = window.devicePixelRatio || 1;
      const w = container.clientWidth;
      const h = 500;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      needsRedraw.current = true;
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      if (!ctx || !canvas) return;
      if (!needsRedraw.current) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }
      needsRedraw.current = false;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Background
      const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
      bg.addColorStop(0, "#0f1729");
      bg.addColorStop(1, "#060a14");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Grid
      const t = transformRef.current;
      ctx.strokeStyle = "rgba(148,163,184,0.03)";
      ctx.lineWidth = 0.5;
      const gs = 40 * t.scale;
      if (gs > 4) {
        const ox = t.x % gs;
        const oy = t.y % gs;
        for (let x = ox; x < w; x += gs) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = oy; y < h; y += gs) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
      }

      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.scale(t.scale, t.scale);

      drawFlowchartEdges(ctx, flowResult.layout);
      drawFlowchartNodes(ctx, flowResult.layout);

      ctx.restore();
      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [viewMode, flowResult]);

  // Screen → world coordinate conversion
  const screenToWorld = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const px = (clientX - rect.left) * (canvas.width / dpr / rect.width);
    const py = (clientY - rect.top) * (canvas.height / dpr / rect.height);
    const t = transformRef.current;
    return { x: (px - t.x) / t.scale, y: (py - t.y) / t.scale };
  }, []);

  // Hit test: find node at world coords
  const findNodeAt = useCallback((wx: number, wy: number): LayoutNode | null => {
    const nodes = flowNodesRef.current;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      if (wx >= n.x && wx <= n.x + n.width && wy >= n.y - n.height / 2 && wy <= n.y + n.height / 2) {
        return n;
      }
    }
    return null;
  }, []);

  // Mouse handlers with node dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const w = screenToWorld(e.clientX, e.clientY);
    const node = findNodeAt(w.x, w.y);
    if (node) {
      dragNodeRef.current = node;
      dragOffset.current = { x: w.x - node.x, y: w.y - node.y };
    } else {
      isPanning.current = true;
    }
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, [screenToWorld, findNodeAt]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Dragging a node
    if (dragNodeRef.current) {
      const w = screenToWorld(e.clientX, e.clientY);
      dragNodeRef.current.x = w.x - dragOffset.current.x;
      dragNodeRef.current.y = w.y - dragOffset.current.y;
      needsRedraw.current = true;
      return;
    }

    // Panning
    if (isPanning.current) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      transformRef.current.x += dx;
      transformRef.current.y += dy;
      needsRedraw.current = true;
      return;
    }

    // Hover cursor
    const w = screenToWorld(e.clientX, e.clientY);
    const hovered = findNodeAt(w.x, w.y);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = hovered ? "move" : "grab";
    }
  }, [screenToWorld, findNodeAt]);

  const handleMouseUp = useCallback(() => {
    dragNodeRef.current = null;
    isPanning.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const t = transformRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.15, Math.min(5, t.scale * delta));
    t.x = mx - ((mx - t.x) / t.scale) * newScale;
    t.y = my - ((my - t.y) / t.scale) * newScale;
    t.scale = newScale;
    needsRedraw.current = true;
  }, []);

  const zoomIn = () => {
    const t = transformRef.current;
    const c = containerRef.current;
    if (!c) return;
    const cx = c.clientWidth / 2, cy = 250;
    const ns = Math.min(5, t.scale * 1.3);
    t.x = cx - ((cx - t.x) / t.scale) * ns;
    t.y = cy - ((cy - t.y) / t.scale) * ns;
    t.scale = ns;
    needsRedraw.current = true;
  };

  const zoomOut = () => {
    const t = transformRef.current;
    const c = containerRef.current;
    if (!c) return;
    const cx = c.clientWidth / 2, cy = 250;
    const ns = Math.max(0.15, t.scale / 1.3);
    t.x = cx - ((cx - t.x) / t.scale) * ns;
    t.y = cy - ((cy - t.y) / t.scale) * ns;
    t.scale = ns;
    needsRedraw.current = true;
  };

  const fitView = () => {
    const c = containerRef.current;
    if (!c) return;
    const cw = c.clientWidth, ch = 500;
    const tw = flowBounds.maxX - flowBounds.minX + 100;
    const th = flowBounds.maxY - flowBounds.minY + 100;
    const scale = Math.min(cw / tw, ch / th, 1);
    const cx = (flowBounds.minX + flowBounds.maxX) / 2;
    const cy = (flowBounds.minY + flowBounds.maxY) / 2;
    transformRef.current = { x: cw / 2 - cx * scale, y: ch / 2 - cy * scale, scale };
    needsRedraw.current = true;
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-5 py-3">
        <h3 className="text-sm font-semibold text-foreground">Mind Map</h3>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex gap-1 rounded-md border border-border bg-muted/50 p-0.5">
            <button
              onClick={() => setViewMode("tree")}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                viewMode === "tree"
                  ? "bg-orange-500 text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tree
            </button>
            <button
              onClick={() => setViewMode("flowchart")}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                viewMode === "flowchart"
                  ? "bg-orange-500 text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Flowchart
            </button>
          </div>

          {/* Search (tree view only) */}
          {viewMode === "tree" && (
            <div className="relative">
              <svg
                className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-36 rounded-md border border-border bg-muted/50 py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-orange-500/50"
              />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {viewMode === "tree" ? (
        /* ── Tree Outline View ─────────────────────────── */
        <div
          className="overflow-auto bg-background px-6 py-5"
          style={{ maxHeight: 500 }}
        >
          <TreeOutlineNode
            node={mindMap}
            depth={0}
            searchQuery={searchQuery}
          />
        </div>
      ) : (
        /* ── Flowchart Canvas View ─────────────────────── */
        <div ref={containerRef} className="relative" style={{ height: 500 }}>
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            className="cursor-grab active:cursor-grabbing"
            style={{ display: "block" }}
          />

          {/* Zoom Controls */}
          <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-lg border border-border bg-card/95 p-1 backdrop-blur-sm">
            <button
              onClick={zoomIn}
              className="rounded px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
              title="Zoom in"
            >
              +
            </button>
            <button
              onClick={fitView}
              className="rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              title="Fit view"
            >
              Fit
            </button>
            <button
              onClick={zoomOut}
              className="rounded px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
              title="Zoom out"
            >
              &minus;
            </button>
          </div>

          {/* Hint */}
          <div className="absolute left-3 top-3 z-10 rounded-md border border-border bg-card/95 px-3 py-1.5 backdrop-blur-sm">
            <p className="text-[10px] text-muted-foreground">
              Scroll to zoom &middot; Drag background to pan &middot; Drag nodes to move
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
