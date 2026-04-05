import { useCallback } from "react";

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
}

type PositionMap = Record<string, { x: number; y: number }>;

export function useGraphLayout(storageKey: string): {
  loadLayout: (nodes: LayoutNode[]) => void;
  saveLayout: (nodes: LayoutNode[]) => void;
  clearLayout: () => void;
} {
  const loadLayout = useCallback(
    (nodes: LayoutNode[]) => {
      try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return;
        const saved: PositionMap = JSON.parse(raw);
        for (const node of nodes) {
          const pos = saved[node.id];
          if (pos) {
            node.x = pos.x;
            node.y = pos.y;
          }
        }
      } catch {
        // parse failure or no localStorage — no-op
      }
    },
    [storageKey]
  );

  const saveLayout = useCallback(
    (nodes: LayoutNode[]) => {
      try {
        const map: PositionMap = {};
        for (const node of nodes) {
          map[node.id] = { x: node.x, y: node.y };
        }
        localStorage.setItem(storageKey, JSON.stringify(map));
      } catch {
        // private browsing or storage full — silently ignore
      }
    },
    [storageKey]
  );

  const clearLayout = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // private browsing or unusual browser config — silently ignore
    }
  }, [storageKey]);

  return { loadLayout, saveLayout, clearLayout };
}
