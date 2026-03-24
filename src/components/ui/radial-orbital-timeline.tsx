"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowRight, Link as LinkIcon, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineItem {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  icon: React.ElementType;
  relatedIds: number[];
  status: "completed" | "in-progress" | "pending";
  energy: number;
}

interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
  className?: string;
}

export default function RadialOrbitalTimeline({
  timelineData,
  className,
}: RadialOrbitalTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = timelineData.find((item) => item.id === itemId);
    return currentItem ? currentItem.relatedIds : [];
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        if (parseInt(key) !== id) newState[parseInt(key)] = false;
      });
      newState[id] = !prev[id];
      if (!prev[id]) {
        setActiveNodeId(id);
        setAutoRotate(false);
        const relatedItems = getRelatedItems(id);
        const newPulseEffect: Record<number, boolean> = {};
        relatedItems.forEach((relId) => { newPulseEffect[relId] = true; });
        setPulseEffect(newPulseEffect);
        centerViewOnNode(id);
      } else {
        setActiveNodeId(null);
        setAutoRotate(true);
        setPulseEffect({});
      }
      return newState;
    });
  };

  useEffect(() => {
    let rotationTimer: NodeJS.Timeout;
    if (autoRotate) {
      rotationTimer = setInterval(() => {
        setRotationAngle((prev) => {
          const newAngle = (prev + 0.3) % 360;
          return Number(newAngle.toFixed(3));
        });
      }, 50);
    }
    return () => {
      if (rotationTimer) clearInterval(rotationTimer);
    };
  }, [autoRotate]);

  const centerViewOnNode = (nodeId: number) => {
    const nodeIndex = timelineData.findIndex((item) => item.id === nodeId);
    const totalNodes = timelineData.length;
    const targetAngle = (nodeIndex / totalNodes) * 360;
    setRotationAngle(270 - targetAngle);
  };

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radius = 180;
    const radian = (angle * Math.PI) / 180;
    const x = radius * Math.cos(radian);
    const y = radius * Math.sin(radian);
    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Math.max(0.4, Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(radian)) / 2)));
    return { x, y, angle, zIndex, opacity };
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    return getRelatedItems(activeNodeId).includes(itemId);
  };

  const getStatusColor = (status: TimelineItem["status"]) => {
    switch (status) {
      case "completed": return "bg-amber-500 text-black";
      case "in-progress": return "bg-amber-500/30 text-amber-300 border border-amber-500/50";
      case "pending": return "bg-white/10 text-white/60 border border-white/20";
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className={cn("relative w-full h-[550px] flex items-center justify-center overflow-hidden", className)}
    >
      <div className="relative w-full max-w-3xl h-full flex items-center justify-center">
        <div
          ref={orbitRef}
          className="absolute w-full h-full flex items-center justify-center"
          style={{ perspective: "1000px" }}
        >
          {/* Central core */}
          <div className="absolute w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 animate-pulse flex items-center justify-center z-10">
            <div className="absolute w-20 h-20 rounded-full border border-amber-400/20 animate-ping opacity-70" />
            <div className="absolute w-24 h-24 rounded-full border border-amber-400/10 animate-ping opacity-50" style={{ animationDelay: "0.5s" }} />
            <div className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-md" />
          </div>

          {/* Orbit ring */}
          <div className="absolute w-[360px] h-[360px] rounded-full border border-white/[0.06]" />
          <div className="absolute w-[362px] h-[362px] rounded-full border border-amber-500/[0.04]" />

          {/* Nodes */}
          {timelineData.map((item, index) => {
            const position = calculateNodePosition(index, timelineData.length);
            const isExpanded = expandedItems[item.id];
            const isRelated = isRelatedToActive(item.id);
            const isPulsing = pulseEffect[item.id];
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                ref={(el) => { nodeRefs.current[item.id] = el; }}
                className="absolute transition-all duration-700 cursor-pointer"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px)`,
                  zIndex: isExpanded ? 200 : position.zIndex,
                  opacity: isExpanded ? 1 : position.opacity,
                }}
                suppressHydrationWarning
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(item.id);
                }}
              >
                {/* Energy aura */}
                <div
                  className={cn(
                    "absolute rounded-full -inset-1",
                    isPulsing && "animate-pulse duration-1000"
                  )}
                  style={{
                    background: "radial-gradient(circle, rgba(251,191,36,0.15) 0%, rgba(251,191,36,0) 70%)",
                    width: `${item.energy * 0.5 + 40}px`,
                    height: `${item.energy * 0.5 + 40}px`,
                    left: `-${(item.energy * 0.5 + 40 - 40) / 2}px`,
                    top: `-${(item.energy * 0.5 + 40 - 40) / 2}px`,
                  }}
                />

                {/* Node circle */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 transform",
                    isExpanded
                      ? "bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/30 scale-150"
                      : isRelated
                        ? "bg-amber-500/30 text-amber-300 border-amber-400 animate-pulse"
                        : "bg-[#0c0c16] text-amber-400/70 border-white/20 hover:border-amber-500/40"
                  )}
                >
                  <Icon size={16} />
                </div>

                {/* Title label */}
                <div
                  className={cn(
                    "absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold tracking-wider transition-all duration-300",
                    isExpanded ? "text-amber-400 scale-110" : "text-white/50"
                  )}
                >
                  {item.title}
                </div>

                {/* Expanded card */}
                {isExpanded && (
                  <div className="absolute top-20 left-1/2 -translate-x-1/2 w-64 bg-[#0c0c16]/95 backdrop-blur-lg border border-amber-500/20 rounded-xl shadow-xl shadow-amber-500/5 overflow-visible p-4">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3 bg-amber-500/40" />
                    <div className="flex justify-between items-center mb-2">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", getStatusColor(item.status))}>
                        {item.status === "completed" ? "Complete" : item.status === "in-progress" ? "In Progress" : "Pending"}
                      </span>
                      <span className="text-[10px] font-mono text-white/40">{item.date}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white font-display mb-1">{item.title}</h4>
                    <p className="text-xs text-white/60 leading-relaxed">{item.content}</p>

                    <div className="mt-3 pt-3 border-t border-white/[0.06]">
                      <div className="flex justify-between items-center text-[10px] mb-1">
                        <span className="flex items-center text-white/50">
                          <Zap size={10} className="mr-1 text-amber-500" />
                          Energy Level
                        </span>
                        <span className="font-mono text-amber-400">{item.energy}%</span>
                      </div>
                      <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: `${item.energy}%` }} />
                      </div>
                    </div>

                    {item.relatedIds.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/[0.06]">
                        <div className="flex items-center mb-2">
                          <LinkIcon size={10} className="text-white/40 mr-1" />
                          <span className="text-[10px] uppercase tracking-wider font-medium text-white/40">Connected</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {item.relatedIds.map((relatedId) => {
                            const relatedItem = timelineData.find((i) => i.id === relatedId);
                            return (
                              <button
                                key={relatedId}
                                className="flex items-center h-6 px-2 text-[10px] border border-white/10 bg-transparent hover:bg-amber-500/10 text-white/60 hover:text-amber-400 transition-all rounded"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleItem(relatedId);
                                }}
                              >
                                {relatedItem?.title}
                                <ArrowRight size={8} className="ml-1 text-white/40" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
