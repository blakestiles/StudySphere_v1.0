"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Brain, BookOpen, Network, Link2, Download, Search, X, ZoomIn, ZoomOut, Maximize2, Loader2, GraduationCap, TrendingUp, Unlink, ArrowRight } from "lucide-react";
import { TopicNode, Edge, bfsShortestPath, getSharedKeywords, isGapNode, getClusterName, computeDecayAlpha } from "./graph-algorithms";
import { useGraphLayout } from "./useGraphLayout";

// ── Types ──────────────────────────────────────────────

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

const PHYSICS = {
  repulsion: 12_000,
  gravityStrength: 0.0003,
  samePackTarget: 180,
  crossPackTarget: 300,
  samePackSpring: 0.006,
  crossPackSpring: 0.0015,
  dampen: 0.9,
  jitter: 0.15,
  alphaDecay: 0.997,
  alphaMin: 0.08,
  alphaInitial: 0.5,
} as const;

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

  // Mastery overlay
  const [masteryMode, setMasteryMode] = useState(false);
  const [masteryLoading, setMasteryLoading] = useState(false);
  const [packMastery, setPackMastery] = useState<Record<string, { avg: number; attempted: boolean }>>({});
  const masteryModeRef = useRef(false);
  const packMasteryRef = useRef<Record<string, { avg: number; attempted: boolean }>>({});

  // Time-decay fade
  const [decayMode, setDecayMode] = useState(false);
  const decayModeRef = useRef(false);
  const packLastActivityRef = useRef<Record<string, number | null>>({});


  // Graph insights (computed after load)
  const [graphInsights, setGraphInsights] = useState<{
    topNode: TopicNode | null;
    topNodeDegree: number;
    isolatedCount: number;
    crossPackBridges: number;
  } | null>(null);

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
  const hoveredEdge = useRef<Edge | null>(null);
  const selectedNodeRef = useRef<TopicNode | null>(null);
  const tickCount = useRef(0);
  const sizeRef = useRef({ w: 1000, h: 650 });
  const nodeIndexMapRef = useRef<Map<string, number>>(new Map());
  const nodeMapRef = useRef<Map<string, TopicNode>>(new Map());
  const directedEdgeMapRef = useRef<Map<string, "forward" | "backward" | "both">>(new Map());
  const minimapCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDarkRef = useRef(document.documentElement.classList.contains("dark"));
  const edgeKeywordsCacheRef = useRef<Map<string, string[]>>(new Map());
  const clusterNamesRef = useRef<Map<string, string>>(new Map());
  const historyDataRef = useRef<any[] | null>(null);

  // Path finder state
  const [pathMode, setPathMode] = useState(false);
  const pathNodesRef = useRef<Set<string>>(new Set());
  const pathEdgesRef = useRef<Set<string>>(new Set());
  const pathStartRef = useRef<TopicNode | null>(null);
  const [pathStart, setPathStart] = useState<TopicNode | null>(null);
  const [pathEnd, setPathEnd] = useState<TopicNode | null>(null);
  const pathModeRef = useRef(false);

  // Filter/search refs for render loop access
  const hiddenPacksRef = useRef<Set<string>>(new Set());
  const searchQueryRef = useRef("");
  const focusHopsRef = useRef(0);
  const focusSetRef = useRef<Set<string> | null>(null);

  const router = useRouter();
  const { loadLayout, saveLayout } = useGraphLayout("kg-layout-v1");

  // Sync state to refs
  useEffect(() => { hiddenPacksRef.current = hiddenPacks; }, [hiddenPacks]);
  useEffect(() => { searchQueryRef.current = searchQuery.toLowerCase(); }, [searchQuery]);
  useEffect(() => { masteryModeRef.current = masteryMode; }, [masteryMode]);
  useEffect(() => { pathModeRef.current = pathMode; }, [pathMode]);
  useEffect(() => { packMasteryRef.current = packMastery; }, [packMastery]);
  useEffect(() => { decayModeRef.current = decayMode; }, [decayMode]);
  useEffect(() => {
    focusHopsRef.current = focusHops;
    if (focusHops > 0 && selectedNodeRef.current) {
      focusSetRef.current = getNeighbors(selectedNodeRef.current.id, edgesRef.current, focusHops);
    } else {
      focusSetRef.current = null;
    }
  }, [focusHops, selectedNode]);

  useEffect(() => {
    const obs = new MutationObserver(() => {
      isDarkRef.current = document.documentElement.classList.contains("dark");
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // ── Fetch Data ───────────────────────────────────────

  useEffect(() => {
    async function fetchData() {
      let allTopics: TopicNode[] = [];
      try {
        const res = await fetch("/api/study-packs");
        if (!res.ok) return;
        const data = await res.json();
        const packs = Array.isArray(data) ? data : data.studyPacks || [];

        const allEdges: Edge[] = [];
        const colorMap: Record<string, string> = {};
        const nameMap: Record<string, string> = {};

        packs.forEach((pack: any, i: number) => {
          colorMap[pack._id] = PACK_COLORS[i % PACK_COLORS.length];
          nameMap[pack._id] = pack.title;
        });

        const packResponses = await Promise.all(
          packs.map((pack: any) =>
            fetch(`/api/study-packs/${pack._id}`).then(r => r.ok ? r.json() : null)
          )
        );

        for (let pi = 0; pi < packs.length; pi++) {
          const pack = packs[pi];
          const packData = packResponses[pi];
          if (!packData) continue;
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
              x: 100 + Math.random() * 800,
              y: 50 + Math.random() * 550,
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
        nodeMapRef.current = new Map(allTopics.map(n => [n.id, n]));
        nodeIndexMapRef.current = new Map(allTopics.map((n, i) => [n.id, i]));
        edgesRef.current = allEdges;

        // Cache edge keywords (computed once, used in draw)
        const kwCache = new Map<string, string[]>();
        const nodeMapForCache = new Map(allTopics.map(n => [n.id, n]));
        for (const e of allEdges) {
          if (e.type !== "cross-pack") continue;
          const s = nodeMapForCache.get(e.source);
          const t = nodeMapForCache.get(e.target);
          if (s && t) kwCache.set(`${e.source}->${e.target}`, getSharedKeywords(s, t, 3));
        }
        edgeKeywordsCacheRef.current = kwCache;

        // Cache cluster names (computed once, used in draw)
        const packGroupsForNames = new Map<string, TopicNode[]>();
        for (const n of allTopics) {
          if (!packGroupsForNames.has(n.packId)) packGroupsForNames.set(n.packId, []);
          packGroupsForNames.get(n.packId)!.push(n);
        }
        const nameCache = new Map<string, string>();
        for (const [packId, nodes] of packGroupsForNames) {
          nameCache.set(packId, getClusterName(nodes));
        }
        clusterNamesRef.current = nameCache;

        // Compute directed edges based on name-in-content reference
        const dMap = new Map<string, "forward" | "backward" | "both">();
        for (const e of allEdges) {
          if (e.type !== "cross-pack") continue;
          const srcN = nodeMapRef.current.get(e.source);
          const tgtN = nodeMapRef.current.get(e.target);
          if (!srcN || !tgtN) continue;
          const srcNameLow = srcN.name.toLowerCase();
          const tgtNameLow = tgtN.name.toLowerCase();
          const srcInTgtContent = tgtN.content.toLowerCase().includes(srcNameLow) && srcNameLow.length > 5;
          const tgtInSrcContent = srcN.content.toLowerCase().includes(tgtNameLow) && tgtNameLow.length > 5;
          if (srcInTgtContent && tgtInSrcContent) dMap.set(`${e.source}->${e.target}`, "both");
          else if (srcInTgtContent) dMap.set(`${e.source}->${e.target}`, "forward");
          else if (tgtInSrcContent) dMap.set(`${e.source}->${e.target}`, "backward");
        }
        directedEdgeMapRef.current = dMap;

        // Compute graph insights
        if (allTopics.length > 0) {
          const degree: Record<string, number> = {};
          for (const e of allEdges) {
            degree[e.source] = (degree[e.source] || 0) + 1;
            degree[e.target] = (degree[e.target] || 0) + 1;
          }
          let topNode = allTopics[0];
          for (const n of allTopics) {
            if ((degree[n.id] || 0) > (degree[topNode.id] || 0)) topNode = n;
          }
          const hasCross = new Set<string>();
          for (const e of allEdges) {
            if (e.type === "cross-pack") { hasCross.add(e.source); hasCross.add(e.target); }
          }
          setGraphInsights({
            topNode,
            topNodeDegree: degree[topNode.id] || 0,
            isolatedCount: allTopics.filter(n => !hasCross.has(n.id)).length,
            crossPackBridges: hasCross.size,
          });
        }
      } catch {
        // silent
      } finally {
        loadLayout(allTopics);
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      if (nodesRef.current.length > 0) saveLayout(nodesRef.current);
    }, 4000);
    return () => clearInterval(interval);
  }, [loading, saveLayout]);

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

    // Edge hover detection (only when not hovering a node)
    if (!hoveredNode.current) {
      let closestEdge: Edge | null = null;
      let closestDist = 12;
      const nodeMap = nodeMapRef.current;
      for (const e of edgesRef.current) {
        if (e.type !== "cross-pack") continue;
        const src = nodeMap.get(e.source);
        const tgt = nodeMap.get(e.target);
        if (!src || !tgt) continue;
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) continue;
        const t = Math.max(0, Math.min(1, ((w.x - src.x) * dx + (w.y - src.y) * dy) / lenSq));
        const px = src.x + t * dx - w.x;
        const py = src.y + t * dy - w.y;
        const dist = Math.sqrt(px * px + py * py);
        if (dist < closestDist) {
          closestDist = dist;
          closestEdge = e;
        }
      }
      hoveredEdge.current = closestEdge;
    } else {
      hoveredEdge.current = null;
    }
  }, [screenToWorld, findNodeAt]);

  const handleMouseUp = useCallback(() => {
    dragNode.current = null;
    isPanning.current = false;
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (pathModeRef.current) {
      const w2 = screenToWorld(e.clientX, e.clientY);
      const node = findNodeAt(w2.x, w2.y);
      if (node) {
        if (!pathStartRef.current) {
          pathStartRef.current = node;
          setPathStart(node);
        } else if (pathStartRef.current.id !== node.id) {
          const path = bfsShortestPath(pathStartRef.current.id, node.id, edgesRef.current);
          if (path) {
            pathNodesRef.current = new Set(path);
            const edgeKeys = new Set<string>();
            for (let i = 0; i < path.length - 1; i++) {
              edgeKeys.add(`${path[i]}->${path[i+1]}`);
              edgeKeys.add(`${path[i+1]}->${path[i]}`);
            }
            pathEdgesRef.current = edgeKeys;
          } else {
            pathNodesRef.current = new Set();
            pathEdgesRef.current = new Set();
          }
          setPathEnd(node);
        }
      }
      return;
    }

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

  const clearPath = useCallback(() => {
    setPathMode(false);
    pathModeRef.current = false;
    pathStartRef.current = null;
    pathNodesRef.current = new Set();
    pathEdgesRef.current = new Set();
    setPathStart(null);
    setPathEnd(null);
  }, []);

  // ── Mastery Overlay ───────────────────────────────────

  const fetchHistory = useCallback(async (): Promise<any[]> => {
    if (historyDataRef.current !== null) return historyDataRef.current;
    try {
      const res = await fetch("/api/history");
      if (res.ok) {
        historyDataRef.current = await res.json();
      } else {
        historyDataRef.current = [];
      }
    } catch {
      historyDataRef.current = [];
    }
    return historyDataRef.current!;
  }, []);

  const toggleMasteryMode = useCallback(async () => {
    const turningOn = !masteryMode;
    if (turningOn && Object.keys(packMastery).length === 0) {
      setMasteryLoading(true);
      const activities = await fetchHistory();
      const quizActivities = (activities as any[]).filter((a) => a.type === "quiz");
      const byPack: Record<string, number[]> = {};
      for (const q of quizActivities) {
        const packId = q.packId as string | undefined;
        if (!packId) continue;
        const pct = q.totalQuestions > 0 ? (q.score / q.totalQuestions) * 100 : 0;
        if (!byPack[packId]) byPack[packId] = [];
        byPack[packId].push(pct);
      }
      const mastery: Record<string, { avg: number; attempted: boolean }> = {};
      for (const packId of Object.keys(packNamesRef.current)) {
        if (byPack[packId]?.length > 0) {
          const avg = byPack[packId].reduce((a, b) => a + b, 0) / byPack[packId].length;
          mastery[packId] = { avg, attempted: true };
        } else {
          mastery[packId] = { avg: 0, attempted: false };
        }
      }
      setPackMastery(mastery);
      setMasteryLoading(false);
    }
    setMasteryMode((prev) => !prev);
  }, [masteryMode, packMastery, fetchHistory]);

  const toggleDecayMode = useCallback(async () => {
    const turningOn = !decayMode;
    if (turningOn && Object.keys(packLastActivityRef.current).length === 0) {
      const activities = await fetchHistory();
      const quizActivities = (activities as any[]).filter((a) => a.type === "quiz");
      const lastByPack: Record<string, number | null> = {};
      for (const packId of Object.keys(packNamesRef.current)) {
        lastByPack[packId] = null;
      }
      for (const q of quizActivities) {
        const packId = q.packId as string | undefined;
        if (!packId) continue;
        const ts = new Date(q.createdAt || q.date || Date.now()).getTime();
        if (!lastByPack[packId] || ts > lastByPack[packId]!) lastByPack[packId] = ts;
      }
      packLastActivityRef.current = lastByPack;
    }
    setDecayMode(prev => !prev);
  }, [decayMode, fetchHistory]);

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
      // Alpha never fully decays — keeps a gentle minimum so nodes stay alive
      const alpha = Math.max(PHYSICS.alphaMin, PHYSICS.alphaInitial * Math.pow(PHYSICS.alphaDecay, tickCount.current));
      tickCount.current++;

      // Center gravity (gentle pull so graph doesn't fly off)
      for (const n of ns) {
        if (dragNode.current === n || hidden.has(n.packId)) continue;
        n.vx += (CX - n.x) * PHYSICS.gravityStrength;
        n.vy += (CY - n.y) * PHYSICS.gravityStrength;
      }

      // Repulsion — much stronger so nodes spread out
      for (let i = 0; i < ns.length; i++) {
        if (hidden.has(ns[i].packId)) continue;
        for (let j = i + 1; j < ns.length; j++) {
          if (hidden.has(ns[j].packId)) continue;
          const dx = ns[j].x - ns[i].x;
          const dy = ns[j].y - ns[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = 120; // enforce minimum distance
          const effectiveDist = Math.max(dist, minDist * 0.5);
          const repulse = PHYSICS.repulsion / (effectiveDist * effectiveDist);
          const rx = (dx / dist) * repulse * alpha;
          const ry = (dy / dist) * repulse * alpha;
          if (dragNode.current !== ns[i]) { ns[i].vx -= rx; ns[i].vy -= ry; }
          if (dragNode.current !== ns[j]) { ns[j].vx += rx; ns[j].vy += ry; }
        }
      }

      const nodeMap = nodeMapRef.current;

      // Attraction along edges — larger target distances
      for (const e of es) {
        const src = nodeMap.get(e.source);
        const tgt = nodeMap.get(e.target);
        if (!src || !tgt) continue;
        if (hidden.has(src.packId) || hidden.has(tgt.packId)) continue;
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const target = e.type === "same-pack" ? PHYSICS.samePackTarget : PHYSICS.crossPackTarget;
        const str = e.type === "same-pack" ? PHYSICS.samePackSpring : PHYSICS.crossPackSpring * e.strength;
        const force = (dist - target) * str * alpha;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        if (dragNode.current !== src) { src.vx += fx; src.vy += fy; }
        if (dragNode.current !== tgt) { tgt.vx -= fx; tgt.vy -= fy; }
      }

      // Apply velocity with gentle random jitter to keep things alive
      for (const n of ns) {
        if (hidden.has(n.packId)) continue;
        if (dragNode.current === n) { n.vx = 0; n.vy = 0; continue; }
        // Subtle organic drift
        n.vx += (Math.random() - 0.5) * PHYSICS.jitter;
        n.vy += (Math.random() - 0.5) * PHYSICS.jitter;
        n.vx *= PHYSICS.dampen;
        n.vy *= PHYSICS.dampen;
        n.x += n.vx;
        n.y += n.vy;
        n.x = Math.max(40, Math.min(W - 40, n.x));
        n.y = Math.max(40, Math.min(H - 40, n.y));
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
      const isDark = isDarkRef.current;
      const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
      bg.addColorStop(0, isDark ? "#0f1729" : "#f0f4ff");
      bg.addColorStop(1, isDark ? "#060a14" : "#e8eef8");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Subtle grid
      ctx.strokeStyle = isDark ? "rgba(148,163,184,0.04)" : "rgba(100,116,139,0.06)";
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
      const nodeMap = nodeMapRef.current;
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

      const time = Date.now();

      // Pack cluster backgrounds
      const packGroups = new Map<string, TopicNode[]>();
      for (const n of ns) {
        if (hidden.has(n.packId)) continue;
        if (focus && !focus.has(n.id)) continue;
        if (!packGroups.has(n.packId)) packGroups.set(n.packId, []);
        packGroups.get(n.packId)!.push(n);
      }

      for (const [packId, packNodes] of packGroups) {
        if (packNodes.length < 2) continue;
        const color = colors[packId] || "#60a5fa";
        const rgb = hexToRgb(color);

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const n of packNodes) {
          minX = Math.min(minX, n.x - n.radius);
          maxX = Math.max(maxX, n.x + n.radius);
          minY = Math.min(minY, n.y - n.radius);
          maxY = Math.max(maxY, n.y + n.radius);
        }
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const rx = Math.max(40, (maxX - minX) / 2 + 28);
        const ry = Math.max(35, (maxY - minY) / 2 + 24);

        const clusterGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
        clusterGrad.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${isDark ? 0.07 : 0.06})`);
        clusterGrad.addColorStop(0.7, `rgba(${rgb.r},${rgb.g},${rgb.b},${isDark ? 0.04 : 0.03})`);
        clusterGrad.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = clusterGrad;
        ctx.fill();
        ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${isDark ? 0.15 : 0.12})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Cluster name label
        const clusterName = clusterNamesRef.current.get(packId) ?? "";
        if (clusterName) {
          ctx.save();
          ctx.font = `600 9px -apple-system, BlinkMacSystemFont, sans-serif`;
          ctx.textAlign = "center";
          const labelY = cy - ry + 13;
          const lw = ctx.measureText(clusterName.toUpperCase()).width + 10;
          ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${isDark ? 0.18 : 0.14})`;
          const lx = cx - lw / 2, ly = labelY - 8, lrw = lw, lrh = 14, lcr = 4;
          ctx.beginPath();
          ctx.moveTo(lx + lcr, ly);
          ctx.lineTo(lx + lrw - lcr, ly);
          ctx.quadraticCurveTo(lx + lrw, ly, lx + lrw, ly + lcr);
          ctx.lineTo(lx + lrw, ly + lrh - lcr);
          ctx.quadraticCurveTo(lx + lrw, ly + lrh, lx + lrw - lcr, ly + lrh);
          ctx.lineTo(lx + lcr, ly + lrh);
          ctx.quadraticCurveTo(lx, ly + lrh, lx, ly + lrh - lcr);
          ctx.lineTo(lx, ly + lcr);
          ctx.quadraticCurveTo(lx, ly, lx + lcr, ly);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${isDark ? 0.75 : 0.6})`;
          ctx.fillText(clusterName.toUpperCase(), cx, labelY + 1);
          ctx.restore();
        }
      }

      // Draw edges with animated energy flow
      for (const e of es) {
        const src = nodeMap.get(e.source);
        const tgt = nodeMap.get(e.target);
        if (!src || !tgt) continue;
        if (hidden.has(src.packId) || hidden.has(tgt.packId)) continue;
        if (focus && (!focus.has(src.id) || !focus.has(tgt.id))) continue;

        const isHighlighted = sel && (e.source === sel.id || e.target === sel.id);
        const isDimmed = sel && !isHighlighted;
        const isOnPath = pathEdgesRef.current.has(`${e.source}->${e.target}`) || pathEdgesRef.current.has(`${e.target}->${e.source}`);

        // Base line
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);

        if (e.type === "cross-pack") {
          ctx.setLineDash([6, 4]);
          const baseAlpha = 0.06 + e.strength * 0.25;
          ctx.strokeStyle = isDimmed ? "rgba(251,146,60,0.12)" : isHighlighted ? "rgba(251,191,36,0.8)" : `rgba(251,146,60,${baseAlpha})`;
          ctx.lineWidth = isHighlighted ? 1.5 + e.strength * 2 : 0.6 + e.strength * 1.5;
        } else {
          ctx.setLineDash([]);
          ctx.strokeStyle = isDimmed ? "rgba(71,85,105,0.12)" : isHighlighted ? "rgba(148,163,184,0.55)" : "rgba(71,85,105,0.18)";
          ctx.lineWidth = isHighlighted ? 1.5 : 0.7;
        }
        ctx.stroke();
        ctx.setLineDash([]);

        if (isOnPath) {
          ctx.beginPath();
          ctx.moveTo(src.x, src.y);
          ctx.lineTo(tgt.x, tgt.y);
          ctx.strokeStyle = "rgba(16,185,129,0.85)";
          ctx.lineWidth = 3;
          ctx.setLineDash([]);
          ctx.stroke();
        }

        // Directed arrow for prerequisite edges
        if (e.type === "cross-pack" && !isDimmed) {
          const dir = directedEdgeMapRef.current.get(`${e.source}->${e.target}`);
          if (dir) {
            const drawArrow = (fromX: number, fromY: number, toX: number, toY: number, targetRadius: number) => {
              const angle = Math.atan2(toY - fromY, toX - fromX);
              const headLen = 8;
              const hAngle = Math.PI / 6;
              const ax = toX - Math.cos(angle) * (targetRadius + 2);
              const ay = toY - Math.sin(angle) * (targetRadius + 2);
              ctx.beginPath();
              ctx.moveTo(ax - headLen * Math.cos(angle - hAngle), ay - headLen * Math.sin(angle - hAngle));
              ctx.lineTo(ax, ay);
              ctx.lineTo(ax - headLen * Math.cos(angle + hAngle), ay - headLen * Math.sin(angle + hAngle));
              ctx.strokeStyle = isHighlighted ? "rgba(251,191,36,0.9)" : "rgba(251,146,60,0.5)";
              ctx.lineWidth = isHighlighted ? 1.5 : 1;
              ctx.setLineDash([]);
              ctx.stroke();
            };
            if (dir === "forward" || dir === "both") drawArrow(src.x, src.y, tgt.x, tgt.y, tgt.radius);
            if (dir === "backward" || dir === "both") drawArrow(tgt.x, tgt.y, src.x, src.y, src.radius);
          }
        }

        // Animated energy dot flowing along highlighted edges
        if (isHighlighted && !isDimmed) {
          const dx = tgt.x - src.x;
          const dy = tgt.y - src.y;
          const progress = ((time / 1200) % 1);
          const dotX = src.x + dx * progress;
          const dotY = src.y + dy * progress;
          const dotColor = e.type === "cross-pack" ? "rgba(251,191,36,0.9)" : "rgba(148,200,255,0.8)";
          const dotGlow = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 5);
          dotGlow.addColorStop(0, dotColor);
          dotGlow.addColorStop(1, "rgba(0,0,0,0)");
          ctx.beginPath();
          ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
          ctx.fillStyle = dotGlow;
          ctx.fill();
        }
      }

      // Edge label for hovered cross-pack edge
      const he = hoveredEdge.current;
      if (he) {
        const hsrc = nodeMap.get(he.source);
        const htgt = nodeMap.get(he.target);
        if (hsrc && htgt) {
          const mx = (hsrc.x + htgt.x) / 2;
          const my = (hsrc.y + htgt.y) / 2;
          const keywords = edgeKeywordsCacheRef.current.get(`${he.source}->${he.target}`)
            ?? edgeKeywordsCacheRef.current.get(`${he.target}->${he.source}`)
            ?? [];
          if (keywords.length > 0) {
            const label = keywords.join(" · ");
            ctx.font = "500 10px -apple-system, BlinkMacSystemFont, sans-serif";
            const tw = ctx.measureText(label).width;
            const px = 8, py = 5;
            ctx.fillStyle = isDark ? "rgba(15,23,42,0.9)" : "rgba(255,255,255,0.92)";
            ctx.strokeStyle = "rgba(251,146,60,0.4)";
            ctx.lineWidth = 0.8;
            const rx = mx - tw / 2 - px;
            const ry = my - 8 - py;
            const rw = tw + px * 2;
            const rh = 16 + py * 2;
            const cr = 6;
            ctx.beginPath();
            ctx.moveTo(rx + cr, ry);
            ctx.lineTo(rx + rw - cr, ry);
            ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + cr);
            ctx.lineTo(rx + rw, ry + rh - cr);
            ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - cr, ry + rh);
            ctx.lineTo(rx + cr, ry + rh);
            ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - cr);
            ctx.lineTo(rx, ry + cr);
            ctx.quadraticCurveTo(rx, ry, rx + cr, ry);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = isDark ? "rgba(251,146,60,0.9)" : "rgba(180,80,0,0.85)";
            ctx.textAlign = "center";
            ctx.fillText(label, mx, my + 6);
          }
        }
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
      for (const n of ns) {
        if (hidden.has(n.packId)) continue;
        if (focus && !focus.has(n.id)) continue;

        const masteryData = masteryModeRef.current ? packMasteryRef.current[n.packId] : null;
        const color = masteryData
          ? masteryData.attempted
            ? masteryData.avg >= 80 ? "#4ade80" : masteryData.avg >= 60 ? "#fbbf24" : "#f87171"
            : "#64748b"
          : colors[n.packId] || "#60a5fa";
        const rgb = hexToRgb(color);
        const isSelected = sel?.id === n.id;
        const isConnected = connectedIds.has(n.id);
        const isDimmed = sel && !isSelected && !isConnected;
        const isHovered = hoveredNode.current?.id === n.id;
        const isOnPath = pathNodesRef.current.has(n.id);
        const isSearchMatch = hasSearch && searchMatches.has(n.id);
        const isSearchDimmed = hasSearch && !isSearchMatch;

        let globalAlpha = isDimmed ? 0.55 : isSearchDimmed ? 0.45 : 1;
        if (decayModeRef.current && !isDimmed && !isSearchDimmed) {
          const lastActivity = packLastActivityRef.current[n.packId] ?? null;
          globalAlpha = Math.min(globalAlpha, computeDecayAlpha(lastActivity));
        }
        ctx.save();
        ctx.globalAlpha = globalAlpha;

        const sizeBonus = Math.min(4, (n.flashcardCount + n.quizCount) * 0.5);
        const r = (isHovered ? n.radius + 3 : n.radius) + sizeBonus;

        // Each node gets a unique phase offset based on its position in the array
        const nodeIndex = nodeIndexMapRef.current.get(n.id) ?? 0;
        const phase = nodeIndex * 1.37;

        // ── Layer 1: Outer breathing aura ──
        const breathe = 0.5 + 0.5 * Math.sin(time / 1800 + phase);
        const auraRadius = r + 20 + breathe * 8;
        const aura = ctx.createRadialGradient(n.x, n.y, r * 0.6, n.x, n.y, auraRadius);
        aura.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${isSelected ? 0.25 : 0.08})`);
        aura.addColorStop(0.6, `rgba(${rgb.r},${rgb.g},${rgb.b},${isSelected ? 0.08 : 0.03})`);
        aura.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
        ctx.beginPath();
        ctx.arc(n.x, n.y, auraRadius, 0, Math.PI * 2);
        ctx.fillStyle = aura;
        ctx.fill();

        // ── Layer 2: Spinning orbital ring ──
        const orbitRadius = r + 8 + (isSelected ? 4 : 0);
        const orbitSpeed = time / (2200 + nodeIndex * 80);
        ctx.save();
        ctx.translate(n.x, n.y);
        ctx.rotate(orbitSpeed);
        ctx.beginPath();
        ctx.ellipse(0, 0, orbitRadius, orbitRadius * 0.35, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${isSelected ? 0.5 : 0.2})`;
        ctx.lineWidth = isSelected ? 1.5 : 0.8;
        ctx.stroke();
        // Small orbiting dot
        const dotAngle = orbitSpeed * 3;
        const dotX = Math.cos(dotAngle) * orbitRadius;
        const dotY = Math.sin(dotAngle) * orbitRadius * 0.35;
        ctx.beginPath();
        ctx.arc(dotX, dotY, isSelected ? 2.5 : 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${isSelected ? 0.9 : 0.5})`;
        ctx.fill();
        ctx.restore();

        // ── Layer 3: Second orbital (perpendicular, selected/hovered only) ──
        if (isSelected || isHovered) {
          ctx.save();
          ctx.translate(n.x, n.y);
          ctx.rotate(-orbitSpeed * 0.7 + Math.PI / 3);
          ctx.beginPath();
          ctx.ellipse(0, 0, orbitRadius * 0.85, orbitRadius * 0.3, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${isSelected ? 0.35 : 0.15})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
          ctx.restore();
        }

        // ── Layer 4: Search match pulsing ring ──
        if (isSearchMatch && !isDimmed) {
          const pulse = 0.5 + 0.5 * Math.sin(time / 250);
          const pulseRadius = r + 14 + pulse * 8;
          ctx.beginPath();
          ctx.arc(n.x, n.y, pulseRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(251,191,36,${0.3 + pulse * 0.4})`;
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // ── Layer 5: Main node body with gradient ──
        const bodyGrad = ctx.createRadialGradient(
          n.x - r * 0.25, n.y - r * 0.25, r * 0.1,
          n.x, n.y, r
        );
        bodyGrad.addColorStop(0, `rgba(${Math.min(255, rgb.r + 60)},${Math.min(255, rgb.g + 60)},${Math.min(255, rgb.b + 60)},${isSelected ? 1 : 0.85})`);
        bodyGrad.addColorStop(0.5, `rgba(${rgb.r},${rgb.g},${rgb.b},${isSelected ? 0.95 : 0.75})`);
        bodyGrad.addColorStop(1, `rgba(${Math.max(0, rgb.r - 40)},${Math.max(0, rgb.g - 40)},${Math.max(0, rgb.b - 40)},${isSelected ? 0.9 : 0.65})`);
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = bodyGrad;
        ctx.fill();

        // Border ring
        ctx.strokeStyle = isSelected
          ? "rgba(255,255,255,0.8)"
          : isHovered
          ? `rgba(${rgb.r},${rgb.g},${rgb.b},0.7)`
          : `rgba(${rgb.r},${rgb.g},${rgb.b},0.3)`;
        ctx.lineWidth = isSelected ? 2.5 : isHovered ? 1.5 : 1;
        ctx.stroke();

        if (isOnPath) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 5, 0, Math.PI * 2);
          ctx.strokeStyle = pathStartRef.current?.id === n.id ? "rgba(52,211,153,0.9)" : "rgba(16,185,129,0.7)";
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // ── Layer 6: Glass highlight (crescent) ──
        ctx.beginPath();
        ctx.arc(n.x - r * 0.15, n.y - r * 0.2, r * 0.55, -Math.PI * 0.8, Math.PI * 0.15);
        const glass = ctx.createLinearGradient(n.x - r, n.y - r, n.x, n.y);
        glass.addColorStop(0, "rgba(255,255,255,0.25)");
        glass.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = glass;
        ctx.fill();

        // Gap detection indicator
        if (isGapNode(n)) {
          const gx = n.x + r * 0.65;
          const gy = n.y - r * 0.65;
          const gr = 5;
          ctx.beginPath();
          ctx.arc(gx, gy, gr, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(251,146,60,0.95)";
          ctx.fill();
          ctx.font = "bold 7px -apple-system, sans-serif";
          ctx.textAlign = "center";
          ctx.fillStyle = "white";
          ctx.fillText("!", gx, gy + 2.5);
        }

        // ── Layer 7: Pulsing core ──
        const corePulse = 0.6 + 0.4 * Math.sin(time / 600 + phase * 2);
        const coreR = r * 0.25 * corePulse;
        const coreGrad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, coreR);
        coreGrad.addColorStop(0, `rgba(255,255,255,${isSelected ? 0.5 : 0.3})`);
        coreGrad.addColorStop(1, `rgba(255,255,255,0)`);
        ctx.beginPath();
        ctx.arc(n.x, n.y, coreR, 0, Math.PI * 2);
        ctx.fillStyle = coreGrad;
        ctx.fill();

        // ── Label with shadow for readability ──
        const fontSize = isSelected || isSearchMatch ? 12 : 11;
        ctx.font = `${isSelected || isSearchMatch ? 600 : 500} ${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.textAlign = "center";
        const label = n.name.length > 28 ? n.name.slice(0, 26) + "\u2026" : n.name;
        // Text shadow
        ctx.fillStyle = isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.8)";
        ctx.fillText(label, n.x + 1, n.y + r + 18);
        // Actual text
        ctx.fillStyle = isDimmed || isSearchDimmed
          ? isDark ? "rgba(203,213,225,0.45)" : "rgba(100,116,139,0.5)"
          : isSelected
          ? isDark ? "rgba(255,255,255,1)" : "rgba(15,23,42,1)"
          : isDark ? "rgba(220,230,240,0.85)" : "rgba(30,41,59,0.85)";
        ctx.fillText(label, n.x, n.y + r + 17);

        ctx.restore();
      }

      ctx.restore();

      // ── Minimap ──────────────────────────────────────────
      const mm = minimapCanvasRef.current;
      if (mm) {
        const mCtx = mm.getContext("2d");
        if (mCtx) {
          const MW = 140, MH = 90;
          if (mm.width !== MW) mm.width = MW;
          if (mm.height !== MH) mm.height = MH;
          mCtx.fillStyle = isDark ? "rgba(6,10,20,0.92)" : "rgba(240,244,255,0.92)";
          mCtx.fillRect(0, 0, MW, MH);

          const visNs = ns.filter(n => !hidden.has(n.packId));
          if (visNs.length > 0) {
            let mnX = Infinity, mxX = -Infinity, mnY = Infinity, mxY = -Infinity;
            for (const n of visNs) {
              mnX = Math.min(mnX, n.x); mxX = Math.max(mxX, n.x);
              mnY = Math.min(mnY, n.y); mxY = Math.max(mxY, n.y);
            }
            const pad = 20;
            const worldW = Math.max(mxX - mnX + pad * 2, 100);
            const worldH = Math.max(mxY - mnY + pad * 2, 100);
            const scaleX = MW / worldW;
            const scaleY = MH / worldH;
            const mmScale = Math.min(scaleX, scaleY) * 0.85;
            const offX = (MW - worldW * mmScale) / 2 - mnX * mmScale + pad * mmScale;
            const offY = (MH - worldH * mmScale) / 2 - mnY * mmScale + pad * mmScale;

            for (const n of visNs) {
              const mx2 = n.x * mmScale + offX;
              const my2 = n.y * mmScale + offY;
              const mr = Math.max(2, n.radius * mmScale * 0.8);
              const nc = colors[n.packId] || "#60a5fa";
              mCtx.beginPath();
              mCtx.arc(mx2, my2, mr, 0, Math.PI * 2);
              mCtx.fillStyle = nc;
              mCtx.globalAlpha = 0.8;
              mCtx.fill();
              mCtx.globalAlpha = 1;
            }

            const t2 = transformRef.current;
            const { w: CW, h: CH } = sizeRef.current;
            const vx0 = (-t2.x) / t2.scale;
            const vy0 = (-t2.y) / t2.scale;
            const vx1 = (CW - t2.x) / t2.scale;
            const vy1 = (CH - t2.y) / t2.scale;
            const vrx = vx0 * mmScale + offX;
            const vry = vy0 * mmScale + offY;
            const vrw = (vx1 - vx0) * mmScale;
            const vrh = (vy1 - vy0) * mmScale;
            mCtx.strokeStyle = "rgba(255,255,255,0.6)";
            mCtx.lineWidth = 1;
            mCtx.strokeRect(vrx, vry, vrw, vrh);
            mCtx.fillStyle = "rgba(255,255,255,0.04)";
            mCtx.fillRect(vrx, vry, vrw, vrh);
          }

          mCtx.strokeStyle = isDark ? "rgba(148,163,184,0.2)" : "rgba(100,116,139,0.2)";
          mCtx.lineWidth = 1;
          mCtx.strokeRect(0, 0, MW, MH);
        }
      }
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
    // All mutable state (nodes, edges, transform, hover, drag) is accessed via refs, so there
    // are no stale closures. Adding those refs as dependencies would restart the animation loop
    // on every interaction tick — which is exactly what we want to avoid.
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
          const otherNode = nodeMapRef.current.get(otherId);
          return otherNode ? { node: otherNode, type: e.type, strength: e.strength } : null;
        })
        .filter(Boolean) as { node: TopicNode; type: string; strength: number }[]
    : [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <p className="text-sm text-muted-foreground">Building knowledge graph…</p>
      </div>
    );
  }

  if (!loading && nodesRef.current.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-card">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-orange-400 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.04] via-transparent to-transparent pointer-events-none" />
        <div className="relative flex flex-col items-center justify-center gap-4 py-16 text-center px-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-amber-500/20 blur-xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <Network className="h-8 w-8 text-amber-500/80" />
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">No Knowledge Graph Yet</p>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">
              Generate study packs to see your topics visualized as a connected knowledge graph with cross-topic relationships.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-1">
            {[
              { icon: Brain, label: "AI-extracted topics", color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
              { icon: Link2, label: "Cross-pack links", color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
              { icon: BookOpen, label: "From your packs", color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
            ].map(({ icon: Icon, label, color, bg }) => (
              <span key={label} className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12px] font-medium ${bg} ${color}`}>
                <Icon className="h-3.5 w-3.5" />{label}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 overflow-hidden rounded-2xl border border-border/60 bg-card">
      {/* Toolbar: Stats + Search + Export */}
      <div className="flex flex-wrap items-center gap-4 border-b border-border bg-card px-4 py-2.5">
        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_5px_rgba(96,165,250,0.5)]" />
            <span className="font-semibold text-foreground">{nodesRef.current.filter(n => !hiddenPacks.has(n.packId)).length}</span>
            <span>Topics</span>
          </div>
          <div className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
            <Link2 className="h-3.5 w-3.5" />
            <span className="font-semibold text-foreground">{crossPackCount}</span>
            <span>Cross-links</span>
          </div>
          <div className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" />
            <span className="font-semibold text-foreground">{packCount}</span>
            <span>Packs</span>
          </div>
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Search topics…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-44 rounded-lg border border-border/60 bg-muted/30 pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground/40 focus:border-amber-500/40 focus:outline-none focus:ring-1 focus:ring-amber-500/20 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Path Finder */}
        <button
          onClick={() => { if (pathMode) clearPath(); else setPathMode(true); }}
          title="Find shortest path between two topics"
          className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs transition-colors ${
            pathMode
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Network className="h-3.5 w-3.5" />
          {pathMode ? "Cancel" : "Path"}
        </button>

        {/* Mastery Overlay */}
        <button
          onClick={toggleMasteryMode}
          disabled={masteryLoading}
          title="Color nodes by quiz performance"
          className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs transition-colors ${
            masteryMode
              ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
              : "border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {masteryLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GraduationCap className="h-3.5 w-3.5" />}
          Mastery
        </button>

        {/* Time Decay */}
        <button
          onClick={toggleDecayMode}
          title="Fade nodes by days since last study"
          className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs transition-colors ${
            decayMode
              ? "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400"
              : "border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          Decay
        </button>


        {/* Export PNG */}
        <button
          onClick={exportPNG}
          title="Export as PNG"
          className="flex h-8 items-center gap-1.5 rounded-lg border border-border/60 px-3 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
      </div>

      {/* Path Finder Status Bar */}
      {pathMode && (
        <div className="flex items-center gap-2 border-b border-border bg-emerald-500/5 px-4 py-2 text-xs">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {!pathStart ? (
            <span className="text-muted-foreground">Click a <strong className="text-foreground">start node</strong> on the graph</span>
          ) : !pathEnd ? (
            <span className="text-muted-foreground">
              Start: <strong className="text-emerald-600 dark:text-emerald-400">{pathStart.name}</strong> — now click an <strong className="text-foreground">end node</strong>
            </span>
          ) : (
            <span className="text-muted-foreground">
              Path: <strong className="text-foreground">{pathStart.name}</strong> → <strong className="text-foreground">{pathEnd.name}</strong>
              {pathNodesRef.current.size > 0 ? ` (${pathNodesRef.current.size} nodes)` : " — no path found"}
            </span>
          )}
          <button onClick={clearPath} className="ml-auto text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

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
                className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/30 px-2 py-1 text-xs transition-colors hover:bg-muted"
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

        {/* Minimap */}
        <canvas
          ref={minimapCanvasRef}
          width={140}
          height={90}
          className="absolute bottom-12 left-3 z-10 rounded-lg opacity-80 hover:opacity-100 transition-opacity pointer-events-none"
          style={{ width: 140, height: 90 }}
        />

        {/* Right Panel */}
        <div className="absolute right-3 top-3 z-10 flex w-56 flex-col gap-3" style={{ maxHeight: "calc(100% - 60px)", overflowY: "auto" }}>
          {/* Study Packs Legend with Filters */}
          <div className="rounded-xl border border-border/60 bg-card/95 p-3 backdrop-blur-sm">
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

          {/* Insights / Mastery Legend */}
          {!selectedNode && (
            <>
              {/* Graph Insights */}
              {graphInsights && (
                <div className="rounded-xl border border-border/60 bg-card/95 p-3 backdrop-blur-sm">
                  <p className="mb-2 text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
                    Insights
                  </p>
                  <div className="flex flex-col gap-2">
                    {graphInsights.topNode && (
                      <div
                        className="rounded-lg bg-muted/40 px-2.5 py-2 cursor-pointer hover:bg-muted/70 transition-colors"
                        title="Click to inspect most connected topic"
                        onClick={() => {
                          const n = graphInsights.topNode!;
                          selectedNodeRef.current = n;
                          setSelectedNode(n);
                          setConnectedCount(edgesRef.current.filter(e => e.source === n.id || e.target === n.id).length);
                          const { w, h } = sizeRef.current;
                          transformRef.current.x = w / 2 - n.x * transformRef.current.scale;
                          transformRef.current.y = h / 2 - n.y * transformRef.current.scale;
                        }}
                      >
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Most Connected</p>
                        <p className="text-xs font-semibold text-foreground truncate">{graphInsights.topNode.name}</p>
                        <p className="text-[10px] text-muted-foreground">{graphInsights.topNodeDegree} connections · {graphInsights.topNode.packTitle}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="rounded-lg bg-muted/40 px-2.5 py-2">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Bridges</p>
                        <p className="text-sm font-bold text-foreground">{graphInsights.crossPackBridges}</p>
                        <p className="text-[10px] text-muted-foreground">cross-pack</p>
                      </div>
                      <div className="rounded-lg bg-muted/40 px-2.5 py-2">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Isolated</p>
                        <p className="text-sm font-bold text-foreground">{graphInsights.isolatedCount}</p>
                        <p className="text-[10px] text-muted-foreground">topics</p>
                      </div>
                    </div>
                    {graphInsights.isolatedCount > 0 && (
                      <p className="text-[10.5px] text-amber-600 dark:text-amber-400 flex items-start gap-1">
                        <Unlink className="h-3 w-3 mt-0.5 shrink-0" />
                        {graphInsights.isolatedCount} topic{graphInsights.isolatedCount !== 1 ? "s" : ""} have no cross-pack links
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Mastery Legend (only when mastery mode is on) */}
              {masteryMode && (
                <div className="rounded-xl border border-amber-500/20 bg-card/95 p-3 backdrop-blur-sm">
                  <p className="mb-2 text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Mastery Legend
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { color: "#4ade80", label: "Mastered", desc: "≥ 80% avg score" },
                      { color: "#fbbf24", label: "Learning", desc: "60–79%" },
                      { color: "#f87171", label: "Needs Work", desc: "< 60%" },
                      { color: "#64748b", label: "Not Studied", desc: "No quiz attempts" },
                    ].map(({ color, label, desc }) => (
                      <div key={label} className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}88` }} />
                        <div>
                          <span className="text-xs font-medium text-foreground">{label}</span>
                          <span className="text-[10px] text-muted-foreground ml-1">{desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips */}
              {!masteryMode && !graphInsights && (
                <div className="rounded-xl border border-amber-500/20 bg-card/95 p-3 backdrop-blur-sm">
                  <p className="mb-2 text-xs font-semibold text-amber-600 dark:text-amber-400">Tips</p>
                  <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
                    <li>&#8226; Click a node to inspect it</li>
                    <li>&#8226; Double-click to open study pack</li>
                    <li>&#8226; Drag nodes to rearrange</li>
                    <li>&#8226; Scroll to zoom in/out</li>
                    <li>&#8226; Click pack names to filter</li>
                  </ul>
                </div>
              )}
            </>
          )}

          {/* Selected Node Detail Panel */}
          {selectedNode && (
            <div className="rounded-xl border border-amber-500/25 bg-card/95 p-3 backdrop-blur-sm">
              <p className="text-sm font-semibold text-foreground">{selectedNode.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{selectedNode.packTitle}</p>

              {/* Stats row */}
              <div className="mt-2 flex gap-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Link2 className="h-3 w-3" />
                  {connectedCount}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground" title="Flashcards">
                  <BookOpen className="h-3 w-3" />
                  {selectedNode.flashcardCount}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground" title="Quiz questions">
                  <Brain className="h-3 w-3" />
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
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
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
                          <span className="flex-shrink-0 rounded-md bg-amber-500/15 border border-amber-500/20 px-1.5 py-0.5 text-[9px] font-medium text-amber-600 dark:text-amber-400">
                            {Math.round(strength * 100)}%
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mastery score for this pack */}
              {masteryMode && packMastery[selectedNode.packId] && (
                <div className="mt-3 border-t border-border pt-2">
                  <p className="mb-1.5 text-xs font-medium text-foreground flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-amber-500" />
                    Pack Mastery
                  </p>
                  {packMastery[selectedNode.packId].attempted ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${packMastery[selectedNode.packId].avg}%`,
                            backgroundColor: packMastery[selectedNode.packId].avg >= 80 ? "#4ade80"
                              : packMastery[selectedNode.packId].avg >= 60 ? "#fbbf24" : "#f87171",
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-foreground">
                        {Math.round(packMastery[selectedNode.packId].avg)}%
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No quiz attempts yet</p>
                  )}
                </div>
              )}

              {/* Quick study actions */}
              <div className="mt-3 border-t border-border pt-2">
                <p className="mb-1.5 text-xs font-medium text-foreground">Quick Study</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => router.push(`/study-packs/${selectedNode.packId}`)}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-border/60 px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <BookOpen className="h-3 w-3" />
                    Flashcards
                  </button>
                  <button
                    onClick={() => router.push(`/study-packs/${selectedNode.packId}`)}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-border/60 px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Brain className="h-3 w-3" />
                    Take Quiz
                  </button>
                </div>
              </div>

              <button
                onClick={() => router.push(`/study-packs/${selectedNode.packId}`)}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 px-2 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-all"
              >
                Open Study Pack
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-0.5 rounded-xl border border-border/60 bg-card/95 p-1 backdrop-blur-sm">
          <button onClick={zoomIn} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Zoom in">
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button onClick={resetView} className="flex h-7 items-center rounded-lg px-2 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Reset view">
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={zoomOut} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Zoom out">
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}
