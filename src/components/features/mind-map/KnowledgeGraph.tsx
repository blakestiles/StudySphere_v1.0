"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// ── Types ──────────────────────────────────────────────

interface TopicNode {
  id: string;
  name: string;
  packId: string;
  packTitle: string;
  content: string;
  flashcardCount: number;
  quizCount: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Edge {
  source: string;
  target: string;
  type: "same-pack" | "cross-pack";
  strength: number; // 0-1 for cross-pack similarity
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

const PACK_COLORS = [
  "#60a5fa", "#4ade80", "#c084fc", "#fb923c", "#f472b6",
  "#38bdf8", "#a3e635", "#e879f9", "#fbbf24", "#f87171",
];

// ── Word-based similarity for cross-pack matching ──────

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const word of a) {
    if (b.has(word)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union > 0 ? intersection / union : 0;
}

// ── N-hop neighbor computation ─────────────────────────

function getNeighbors(
  nodeId: string,
  edges: Edge[],
  hops: number
): Set<string> {
  const visited = new Set<string>([nodeId]);
  let frontier = new Set<string>([nodeId]);
  for (let h = 0; h < hops; h++) {
    const next = new Set<string>();
    for (const edge of edges) {
      if (frontier.has(edge.source) && !visited.has(edge.target)) {
        next.add(edge.target);
        visited.add(edge.target);
      }
      if (frontier.has(edge.target) && !visited.has(edge.source)) {
        next.add(edge.source);
        visited.add(edge.source);
      }
    }
    frontier = next;
  }
  return visited;
}

// ── Component ──────────────────────────────────────────

export default function KnowledgeGraph() {
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<TopicNode | null>(null);
  const [connectedCount, setConnectedCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [hiddenPacks, setHiddenPacks] = useState<Set<string>>(new Set());
  const [focusHops, setFocusHops] = useState<number>(0); // 0 = off, 1 = 1-hop, 2 = 2-hop

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<TopicNode[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const packColorMapRef = useRef<Record<string, string>>({});
  const packNamesRef = useRef<Record<string, string>>({});
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  // Interaction state
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const dragNode = useRef<TopicNode | null>(null);
  const hoveredNode = useRef<TopicNode | null>(null);
  const selectedNodeRef = useRef<TopicNode | null>(null);
  const tickCount = useRef(0);
  const sizeRef = useRef({ w: 1000, h: 650 });

  // Filter/search refs for render loop access
  const hiddenPacksRef = useRef<Set<string>>(new Set());
  const searchQueryRef = useRef("");
  const focusHopsRef = useRef(0);
  const focusSetRef = useRef<Set<string> | null>(null);

  const router = useRouter();

  // Sync state to refs
  useEffect(() => { hiddenPacksRef.current = hiddenPacks; }, [hiddenPacks]);
  useEffect(() => { searchQueryRef.current = searchQuery.toLowerCase(); }, [searchQuery]);
  useEffect(() => {
    focusHopsRef.current = focusHops;
    if (focusHops > 0 && selectedNodeRef.current) {
      focusSetRef.current = getNeighbors(selectedNodeRef.current.id, edgesRef.current, focusHops);
    } else {
      focusSetRef.current = null;
    }
  }, [focusHops, selectedNode]);

  // ── Fetch Data ───────────────────────────────────────

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/study-packs");
        if (!res.ok) return;
        const data = await res.json();
        const packs = Array.isArray(data) ? data : data.studyPacks || [];

        const allTopics: TopicNode[] = [];
        const allEdges: Edge[] = [];
        const colorMap: Record<string, string> = {};
        const nameMap: Record<string, string> = {};

        packs.forEach((pack: any, i: number) => {
          colorMap[pack._id] = PACK_COLORS[i % PACK_COLORS.length];
          nameMap[pack._id] = pack.title;
        });

        for (const pack of packs) {
          const topicsRes = await fetch(`/api/study-packs/${pack._id}`);
          if (!topicsRes.ok) continue;
          const packData = await topicsRes.json();
          const packTopics = packData.topics || [];
          const packFlashcards = packData.flashcards || [];
          const packQuizQuestions = packData.quizQuestions || [];

          const packTopicNodes: TopicNode[] = packTopics.map((t: any) => {
            const topicId = String(t._id);
            return {
              id: topicId,
              name: t.name,
              packId: pack._id,
              packTitle: pack.title,
              content: t.content || "",
              flashcardCount: packFlashcards.filter((f: any) => String(f.topicId) === topicId).length,
              quizCount: packQuizQuestions.filter((q: any) => String(q.topicId) === topicId).length,
              x: 200 + Math.random() * 600,
              y: 100 + Math.random() * 450,
              vx: 0,
              vy: 0,
              radius: 8 + Math.min(packTopics.length, 8) * 1.5,
            };
          });

          for (let i = 0; i < packTopicNodes.length; i++) {
            for (let j = i + 1; j < packTopicNodes.length; j++) {
              allEdges.push({ source: packTopicNodes[i].id, target: packTopicNodes[j].id, type: "same-pack", strength: 1 });
            }
          }
          allTopics.push(...packTopicNodes);
        }

        // Cross-pack edges using word-based similarity
        for (let i = 0; i < allTopics.length; i++) {
          for (let j = i + 1; j < allTopics.length; j++) {
            if (allTopics[i].packId === allTopics[j].packId) continue;
            const nameA = allTopics[i].name.toLowerCase();
            const nameB = allTopics[j].name.toLowerCase();

            // Direct substring match
            if (nameA.includes(nameB) || nameB.includes(nameA)) {
              allEdges.push({ source: allTopics[i].id, target: allTopics[j].id, type: "cross-pack", strength: 0.9 });
              continue;
            }

            // Word-based similarity on topic name + content
            const tokensA = tokenize(allTopics[i].name + " " + allTopics[i].content.slice(0, 200));
            const tokensB = tokenize(allTopics[j].name + " " + allTopics[j].content.slice(0, 200));
            const sim = jaccardSimilarity(tokensA, tokensB);

            if (sim >= 0.15) {
              allEdges.push({ source: allTopics[i].id, target: allTopics[j].id, type: "cross-pack", strength: Math.min(1, sim * 3) });
            }
          }
        }

        packColorMapRef.current = colorMap;
        packNamesRef.current = nameMap;
        nodesRef.current = allTopics;
        edgesRef.current = allEdges;
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // ── Screen → World coordinates ───────────────────────

  const screenToWorld = useCallback((cx: number, cy: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const px = (cx - rect.left) * (canvas.width / dpr / rect.width);
    const py = (cy - rect.top) * (canvas.height / dpr / rect.height);
    const t = transformRef.current;
    return { x: (px - t.x) / t.scale, y: (py - t.y) / t.scale };
  }, []);

  const findNodeAt = useCallback((wx: number, wy: number): TopicNode | null => {
    const ns = nodesRef.current;
    const hidden = hiddenPacksRef.current;
    for (let i = ns.length - 1; i >= 0; i--) {
      if (hidden.has(ns[i].packId)) continue;
      const dx = ns[i].x - wx;
      const dy = ns[i].y - wy;
      if (dx * dx + dy * dy <= (ns[i].radius + 4) * (ns[i].radius + 4)) return ns[i];
    }
    return null;
  }, []);

  // ── Mouse Events ─────────────────────────────────────

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const w = screenToWorld(e.clientX, e.clientY);
    const node = findNodeAt(w.x, w.y);
    if (node) {
      dragNode.current = node;
    } else {
      isPanning.current = true;
    }
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, [screenToWorld, findNodeAt]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const w = screenToWorld(e.clientX, e.clientY);

    if (dragNode.current) {
      dragNode.current.x = w.x;
      dragNode.current.y = w.y;
      dragNode.current.vx = 0;
      dragNode.current.vy = 0;
      return;
    }

    if (isPanning.current) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const sx = canvas.width / dpr / rect.width;
        const sy = canvas.height / dpr / rect.height;
        transformRef.current.x += dx * sx;
        transformRef.current.y += dy * sy;
      }
      return;
    }

    // Hover detection
    hoveredNode.current = findNodeAt(w.x, w.y);
    const canvas = canvasRef.current;
    if (canvas) canvas.style.cursor = hoveredNode.current ? "pointer" : "grab";
  }, [screenToWorld, findNodeAt]);

  const handleMouseUp = useCallback(() => {
    dragNode.current = null;
    isPanning.current = false;
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const w = screenToWorld(e.clientX, e.clientY);
    const node = findNodeAt(w.x, w.y);
    if (node) {
      const isSame = selectedNodeRef.current?.id === node.id;
      selectedNodeRef.current = isSame ? null : node;
      if (!isSame) {
        const count = edgesRef.current.filter(ed => ed.source === node.id || ed.target === node.id).length;
        setSelectedNode(node);
        setConnectedCount(count);
        setFocusHops(0); // reset focus when selecting new node
        // Spawn particles on select
        for (let i = 0; i < 12; i++) {
          const angle = (Math.PI * 2 * i) / 12;
          particlesRef.current.push({
            x: node.x, y: node.y,
            vx: Math.cos(angle) * (1 + Math.random() * 2),
            vy: Math.sin(angle) * (1 + Math.random() * 2),
            life: 1, maxLife: 40 + Math.random() * 20, size: 2 + Math.random() * 2,
          });
        }
      } else {
        setSelectedNode(null);
        setFocusHops(0);
      }
    } else {
      selectedNodeRef.current = null;
      setSelectedNode(null);
      setFocusHops(0);
    }
  }, [screenToWorld, findNodeAt]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const t = transformRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const mx = (e.clientX - rect.left) * (canvas.width / dpr / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / dpr / rect.height);
    const delta = e.deltaY > 0 ? 0.92 : 1.08;
    const newScale = Math.max(0.25, Math.min(4, t.scale * delta));
    t.x = mx - ((mx - t.x) / t.scale) * newScale;
    t.y = my - ((my - t.y) / t.scale) * newScale;
    t.scale = newScale;
  }, []);

  const handleDblClick = useCallback((e: React.MouseEvent) => {
    const w = screenToWorld(e.clientX, e.clientY);
    const node = findNodeAt(w.x, w.y);
    if (node) router.push(`/study-packs/${node.packId}`);
  }, [screenToWorld, findNodeAt, router]);

  // ── Export as PNG ──────────────────────────────────────

  const exportPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "knowledge-graph.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, []);

  // ── Render Loop ────────────────────────────────────────

  useEffect(() => {
    if (loading) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      const container = containerRef.current;
      if (!container || !canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const w = container.clientWidth;
      const h = 650;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { w, h };
    }
    resize();
    window.addEventListener("resize", resize);

    function physicsStep() {
      const ns = nodesRef.current;
      const es = edgesRef.current;
      if (ns.length === 0) return;

      const hidden = hiddenPacksRef.current;
      const { w: W, h: H } = sizeRef.current;
      const CX = W / 2, CY = H / 2;
      const alpha = Math.max(0.01, 0.4 * Math.pow(0.995, tickCount.current));
      tickCount.current++;

      // Center gravity
      for (const n of ns) {
        if (dragNode.current === n || hidden.has(n.packId)) continue;
        n.vx += (CX - n.x) * 0.0004;
        n.vy += (CY - n.y) * 0.0004;
      }

      // Repulsion
      for (let i = 0; i < ns.length; i++) {
        if (hidden.has(ns[i].packId)) continue;
        for (let j = i + 1; j < ns.length; j++) {
          if (hidden.has(ns[j].packId)) continue;
          const dx = ns[j].x - ns[i].x;
          const dy = ns[j].y - ns[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const repulse = 3000 / (dist * dist);
          const rx = (dx / dist) * repulse * alpha;
          const ry = (dy / dist) * repulse * alpha;
          if (dragNode.current !== ns[i]) { ns[i].vx -= rx; ns[i].vy -= ry; }
          if (dragNode.current !== ns[j]) { ns[j].vx += rx; ns[j].vy += ry; }
        }
      }

      const nodeMap = new Map(ns.map(n => [n.id, n]));

      // Attraction along edges
      for (const e of es) {
        const src = nodeMap.get(e.source);
        const tgt = nodeMap.get(e.target);
        if (!src || !tgt) continue;
        if (hidden.has(src.packId) || hidden.has(tgt.packId)) continue;
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const target = e.type === "same-pack" ? 110 : 200;
        const str = e.type === "same-pack" ? 0.008 : 0.002 * e.strength;
        const force = (dist - target) * str * alpha;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        if (dragNode.current !== src) { src.vx += fx; src.vy += fy; }
        if (dragNode.current !== tgt) { tgt.vx -= fx; tgt.vy -= fy; }
      }

      // Apply velocity
      for (const n of ns) {
        if (hidden.has(n.packId)) continue;
        if (dragNode.current === n) { n.vx = 0; n.vy = 0; continue; }
        n.vx *= 0.88;
        n.vy *= 0.88;
        n.x += n.vx;
        n.y += n.vy;
        n.x = Math.max(50, Math.min(W - 50, n.x));
        n.y = Math.max(50, Math.min(H - 50, n.y));
      }
    }

    function updateParticles() {
      const ps = particlesRef.current;
      for (let i = ps.length - 1; i >= 0; i--) {
        ps[i].x += ps[i].vx;
        ps[i].y += ps[i].vy;
        ps[i].vx *= 0.96;
        ps[i].vy *= 0.96;
        ps[i].life++;
        if (ps[i].life > ps[i].maxLife) ps.splice(i, 1);
      }
    }

    function draw() {
      if (!ctx || !canvas) return;
      const { w: W, h: H } = sizeRef.current;
      const dpr = window.devicePixelRatio || 1;
      const hidden = hiddenPacksRef.current;
      const query = searchQueryRef.current;
      const focus = focusSetRef.current;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Background
      const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
      bg.addColorStop(0, "#0f1729");
      bg.addColorStop(1, "#060a14");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Subtle grid
      ctx.strokeStyle = "rgba(148,163,184,0.04)";
      ctx.lineWidth = 0.5;
      const t = transformRef.current;
      const gridSize = 40 * t.scale;
      const offsetX = t.x % gridSize;
      const offsetY = t.y % gridSize;
      for (let x = offsetX; x < W; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = offsetY; y < H; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // Apply transform
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.scale(t.scale, t.scale);

      const ns = nodesRef.current;
      const es = edgesRef.current;
      const sel = selectedNodeRef.current;
      const nodeMap = new Map(ns.map(n => [n.id, n]));
      const colors = packColorMapRef.current;

      // Connected set for highlighting
      const connectedIds = new Set<string>();
      if (sel) {
        connectedIds.add(sel.id);
        for (const e of es) {
          if (e.source === sel.id) connectedIds.add(e.target);
          if (e.target === sel.id) connectedIds.add(e.source);
        }
      }

      // Search matches
      const hasSearch = query.length > 0;
      const searchMatches = new Set<string>();
      if (hasSearch) {
        for (const n of ns) {
          if (n.name.toLowerCase().includes(query)) searchMatches.add(n.id);
        }
      }

      // Draw edges
      for (const e of es) {
        const src = nodeMap.get(e.source);
        const tgt = nodeMap.get(e.target);
        if (!src || !tgt) continue;
        if (hidden.has(src.packId) || hidden.has(tgt.packId)) continue;
        if (focus && (!focus.has(src.id) || !focus.has(tgt.id))) continue;

        const isHighlighted = sel && (e.source === sel.id || e.target === sel.id);
        const isDimmed = sel && !isHighlighted;

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);

        if (e.type === "cross-pack") {
          ctx.setLineDash([6, 4]);
          const baseAlpha = 0.05 + e.strength * 0.2;
          ctx.strokeStyle = isDimmed ? "rgba(251,146,60,0.03)" : isHighlighted ? "rgba(251,146,60,0.7)" : `rgba(251,146,60,${baseAlpha})`;
          ctx.lineWidth = isHighlighted ? 1 + e.strength * 2 : 0.5 + e.strength * 1.5;
        } else {
          ctx.setLineDash([]);
          ctx.strokeStyle = isDimmed ? "rgba(71,85,105,0.03)" : isHighlighted ? "rgba(148,163,184,0.5)" : "rgba(71,85,105,0.2)";
          ctx.lineWidth = isHighlighted ? 1.5 : 0.7;
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw particles
      for (const p of particlesRef.current) {
        const alpha = 1 - p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(96,165,250,${alpha * 0.6})`;
        ctx.fill();
      }

      // Draw nodes
      const time = Date.now();
      for (const n of ns) {
        if (hidden.has(n.packId)) continue;
        if (focus && !focus.has(n.id)) continue;

        const color = colors[n.packId] || "#60a5fa";
        const isSelected = sel?.id === n.id;
        const isConnected = connectedIds.has(n.id);
        const isDimmed = sel && !isSelected && !isConnected;
        const isHovered = hoveredNode.current?.id === n.id;
        const isSearchMatch = hasSearch && searchMatches.has(n.id);
        const isSearchDimmed = hasSearch && !isSearchMatch;

        const globalAlpha = isDimmed ? 0.15 : isSearchDimmed ? 0.2 : 1;
        ctx.globalAlpha = globalAlpha;

        // Search match pulsing ring
        if (isSearchMatch && !isDimmed) {
          const pulse = 0.5 + 0.5 * Math.sin(time / 300);
          const pulseRadius = n.radius + 12 + pulse * 6;
          ctx.beginPath();
          ctx.arc(n.x, n.y, pulseRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(251,146,60,${0.3 + pulse * 0.3})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Outer glow
        const glowRadius = n.radius + (isSelected ? 16 : isHovered ? 10 : 6);
        const glow = ctx.createRadialGradient(n.x, n.y, n.radius * 0.5, n.x, n.y, glowRadius);
        glow.addColorStop(0, hexToRgba(color, isSelected ? 0.35 : 0.12));
        glow.addColorStop(1, hexToRgba(color, 0));
        ctx.beginPath();
        ctx.arc(n.x, n.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Main circle — size reflects content richness
        const sizeBonus = Math.min(4, (n.flashcardCount + n.quizCount) * 0.5);
        const r = (isHovered ? n.radius + 2 : n.radius) + sizeBonus;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(color, isSelected ? 0.95 : 0.7);
        ctx.fill();

        if (isSelected) {
          ctx.strokeStyle = "rgba(255,255,255,0.7)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Inner highlight for 3D effect
        ctx.beginPath();
        ctx.arc(n.x - r * 0.2, n.y - r * 0.2, r * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fill();

        // Label
        ctx.font = `${isSelected || isSearchMatch ? 600 : 400} 11px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = isDimmed || isSearchDimmed ? "rgba(203,213,225,0.15)" : isSelected ? "rgba(241,245,249,1)" : "rgba(203,213,225,0.7)";
        const label = n.name.length > 28 ? n.name.slice(0, 26) + "..." : n.name;
        ctx.fillText(label, n.x, n.y + r + 16);

        ctx.globalAlpha = 1;
      }

      ctx.restore();
    }

    function loop() {
      physicsStep();
      updateParticles();
      draw();
      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Zoom controls
  const zoomIn = () => { transformRef.current.scale = Math.min(4, transformRef.current.scale * 1.25); };
  const zoomOut = () => { transformRef.current.scale = Math.max(0.25, transformRef.current.scale / 1.25); };
  const resetView = () => { transformRef.current = { x: 0, y: 0, scale: 1 }; };

  const togglePack = (packId: string) => {
    setHiddenPacks((prev) => {
      const next = new Set(prev);
      if (next.has(packId)) next.delete(packId);
      else next.add(packId);
      return next;
    });
  };

  const crossPackCount = edgesRef.current.filter(e => e.type === "cross-pack").length;
  const packCount = Object.keys(packNamesRef.current).length;

  // Search results for panel display
  const searchResults = searchQuery.length > 0
    ? nodesRef.current.filter((n) => n.name.toLowerCase().includes(searchQuery.toLowerCase()) && !hiddenPacks.has(n.packId))
    : [];

  // Connected topics for detail panel
  const connectedTopics = selectedNode
    ? edgesRef.current
        .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
        .map((e) => {
          const otherId = e.source === selectedNode.id ? e.target : e.source;
          const otherNode = nodesRef.current.find((n) => n.id === otherId);
          return otherNode ? { node: otherNode, type: e.type, strength: e.strength } : null;
        })
        .filter(Boolean) as { node: TopicNode; type: string; strength: number }[]
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border bg-background p-12">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading knowledge graph...</p>
        </div>
      </div>
    );
  }

  if (!loading && nodesRef.current.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-background p-12 text-center">
        <p className="text-muted-foreground">
          No study packs found. Generate some study packs to see your knowledge graph.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 overflow-hidden rounded-xl border border-border bg-background">
      {/* Toolbar: Stats + Search + Export */}
      <div className="flex flex-wrap items-center gap-4 border-b border-border bg-card px-4 py-2.5">
        {/* Stats */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.6)]" />
            <span className="text-sm font-medium text-foreground">{nodesRef.current.filter(n => !hiddenPacks.has(n.packId)).length}</span>
            <span className="text-sm text-muted-foreground">Topics</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
              <path d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" />
            </svg>
            <span className="text-sm font-medium text-foreground">{crossPackCount}</span>
            <span className="text-sm text-muted-foreground">Cross-links</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-sm font-medium text-foreground">{packCount}</span>
            <span className="text-sm text-muted-foreground">Packs</span>
          </div>
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div className="relative">
          <svg className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-48 rounded-lg border border-border bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Export PNG */}
        <button
          onClick={exportPNG}
          title="Export as PNG"
          className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Export
        </button>
      </div>

      {/* Search Results Dropdown */}
      {searchQuery && searchResults.length > 0 && (
        <div className="border-b border-border bg-card px-4 py-2">
          <p className="mb-1.5 text-xs text-muted-foreground">{searchResults.length} topic{searchResults.length !== 1 ? "s" : ""} found</p>
          <div className="flex flex-wrap gap-1.5">
            {searchResults.slice(0, 12).map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  selectedNodeRef.current = n;
                  setSelectedNode(n);
                  setConnectedCount(edgesRef.current.filter(e => e.source === n.id || e.target === n.id).length);
                  // Pan to node
                  const { w, h } = sizeRef.current;
                  transformRef.current.x = w / 2 - n.x * transformRef.current.scale;
                  transformRef.current.y = h / 2 - n.y * transformRef.current.scale;
                }}
                className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs transition-colors hover:bg-muted"
              >
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: packColorMapRef.current[n.packId] }}
                />
                <span className="text-foreground">{n.name}</span>
              </button>
            ))}
            {searchResults.length > 12 && (
              <span className="px-2 py-1 text-xs text-muted-foreground">+{searchResults.length - 12} more</span>
            )}
          </div>
        </div>
      )}

      <div ref={containerRef} className="relative" style={{ height: 650 }}>
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleClick}
          onDoubleClick={handleDblClick}
          onWheel={handleWheel}
          className="cursor-grab active:cursor-grabbing"
          style={{ display: "block" }}
        />

        {/* Right Panel */}
        <div className="absolute right-3 top-3 z-10 flex w-56 flex-col gap-3" style={{ maxHeight: "calc(100% - 60px)", overflowY: "auto" }}>
          {/* Study Packs Legend with Filters */}
          <div className="rounded-lg border border-border bg-card/95 p-3 backdrop-blur-sm">
            <p className="mb-2 text-xs font-semibold text-foreground">Study Packs</p>
            <div className="flex flex-col gap-1.5">
              {Object.entries(packNamesRef.current).map(([packId, title]) => (
                <button
                  key={packId}
                  onClick={() => togglePack(packId)}
                  className={`flex items-center gap-2 rounded px-1 py-0.5 text-left text-xs transition-colors hover:bg-muted/50 ${
                    hiddenPacks.has(packId) ? "opacity-40" : ""
                  }`}
                >
                  <div
                    className="h-2.5 w-2.5 flex-shrink-0 rounded-full transition-opacity"
                    style={{
                      backgroundColor: packColorMapRef.current[packId],
                      boxShadow: hiddenPacks.has(packId) ? "none" : `0 0 4px ${packColorMapRef.current[packId]}66`,
                    }}
                  />
                  <span className="truncate text-muted-foreground">{title}</span>
                  {hiddenPacks.has(packId) && (
                    <svg className="ml-auto h-3 w-3 flex-shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            {hiddenPacks.size > 0 && (
              <button
                onClick={() => setHiddenPacks(new Set())}
                className="mt-2 w-full rounded-md bg-muted/50 px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
              >
                Show All
              </button>
            )}
            <div className="mt-2 border-t border-border pt-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-[1px] w-4 bg-muted-foreground/50" />
                <span>Same pack</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-[1px] w-4 border-t border-dashed border-orange-400" />
                <span>Cross-pack link</span>
              </div>
            </div>
          </div>

          {/* Tips (collapsed when node selected to save space) */}
          {!selectedNode && (
            <div className="rounded-lg border border-border bg-card/95 p-3 backdrop-blur-sm">
              <p className="mb-2 text-xs font-semibold text-amber-400">Tips</p>
              <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
                <li>&#8226; Click a node to inspect it</li>
                <li>&#8226; Double-click to open study pack</li>
                <li>&#8226; Drag nodes to rearrange</li>
                <li>&#8226; Scroll to zoom in/out</li>
                <li>&#8226; Click pack names to filter</li>
                <li>&#8226; Thicker dashed = stronger link</li>
              </ul>
            </div>
          )}

          {/* Selected Node Detail Panel */}
          {selectedNode && (
            <div className="rounded-lg border border-blue-500/30 bg-card/95 p-3 backdrop-blur-sm">
              <p className="text-sm font-semibold text-foreground">{selectedNode.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{selectedNode.packTitle}</p>

              {/* Stats row */}
              <div className="mt-2 flex gap-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                    <path d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" />
                  </svg>
                  {connectedCount}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground" title="Flashcards">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                  {selectedNode.flashcardCount}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground" title="Quiz questions">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  {selectedNode.quizCount}
                </div>
              </div>

              {/* Topic content preview */}
              {selectedNode.content && (
                <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-muted-foreground">
                  {selectedNode.content.slice(0, 250)}{selectedNode.content.length > 250 ? "..." : ""}
                </p>
              )}

              {/* Focus Mode */}
              <div className="mt-3 border-t border-border pt-2">
                <p className="mb-1.5 text-xs font-medium text-foreground">Focus Mode</p>
                <div className="flex gap-1">
                  {[
                    { value: 0, label: "Off" },
                    { value: 1, label: "1-hop" },
                    { value: 2, label: "2-hop" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFocusHops(opt.value)}
                      className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                        focusHops === opt.value
                          ? "bg-blue-600/30 text-blue-400"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Connected Topics */}
              {connectedTopics.length > 0 && (
                <div className="mt-3 border-t border-border pt-2">
                  <p className="mb-1.5 text-xs font-medium text-foreground">
                    Connected Topics ({connectedTopics.length})
                  </p>
                  <div className="flex max-h-32 flex-col gap-1 overflow-y-auto">
                    {connectedTopics.map(({ node: cn, type, strength }) => (
                      <button
                        key={cn.id}
                        onClick={() => {
                          selectedNodeRef.current = cn;
                          setSelectedNode(cn);
                          setConnectedCount(edgesRef.current.filter(e => e.source === cn.id || e.target === cn.id).length);
                          setFocusHops(0);
                        }}
                        className="flex items-center gap-1.5 rounded px-1.5 py-1 text-left text-xs transition-colors hover:bg-muted/50"
                      >
                        <div
                          className="h-2 w-2 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: packColorMapRef.current[cn.packId] }}
                        />
                        <span className="flex-1 truncate text-muted-foreground">{cn.name}</span>
                        {type === "cross-pack" && (
                          <span className="flex-shrink-0 rounded bg-orange-500/20 px-1 py-0.5 text-[9px] text-orange-400">
                            {Math.round(strength * 100)}%
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => router.push(`/study-packs/${selectedNode.packId}`)}
                className="mt-3 w-full rounded-md bg-blue-600/20 px-2 py-1.5 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-600/30"
              >
                Open Study Pack
              </button>
            </div>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-lg border border-border bg-card/95 p-1 backdrop-blur-sm">
          <button onClick={zoomIn} className="rounded px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground" title="Zoom in">+</button>
          <button onClick={resetView} className="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground" title="Reset view">Reset</button>
          <button onClick={zoomOut} className="rounded px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground" title="Zoom out">&minus;</button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
