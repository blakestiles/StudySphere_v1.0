export interface TopicNode {
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

export interface Edge {
  source: string;
  target: string;
  type: "same-pack" | "cross-pack";
  strength: number;
}

const BASE_STOPWORDS = new Set([
  "the","and","for","with","this","that","are","was","were","has","have","been",
  "from","into","about","which","their","they","will","would","could","should",
  "more","also","than","when","what","then","there","these","those","each",
  "after","before","during","between","through","over","under","such","some",
  "any","all","one","two","can","its","not","but","you","your",
]);

export function bfsShortestPath(
  startId: string,
  endId: string,
  edges: Edge[]
): string[] | null {
  if (startId === endId) return [startId];

  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
    if (!adjacency.has(edge.target)) adjacency.set(edge.target, []);
    adjacency.get(edge.source)!.push(edge.target);
    adjacency.get(edge.target)!.push(edge.source);
  }

  const parent = new Map<string, string | null>([[startId, null]]);
  const queue: string[] = [startId];

  while (queue.length > 0) {
    const id = queue.shift()!;
    for (const neighbor of adjacency.get(id) ?? []) {
      if (neighbor === endId) {
        // Reconstruct path
        const path: string[] = [neighbor, id];
        let cur = id;
        while (parent.get(cur) !== null) {
          cur = parent.get(cur)!;
          path.push(cur);
        }
        return path.reverse();
      }
      if (!parent.has(neighbor)) {
        parent.set(neighbor, id);
        queue.push(neighbor);
      }
    }
  }

  return null;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !BASE_STOPWORDS.has(w));
}

function wordFrequency(words: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const word of words) {
    freq.set(word, (freq.get(word) ?? 0) + 1);
  }
  return freq;
}

export function getSharedKeywords(
  a: TopicNode,
  b: TopicNode,
  maxWords = 3
): string[] {
  const textA = `${a.name} ${a.content.slice(0, 200)}`;
  const textB = `${b.name} ${b.content.slice(0, 200)}`;

  const freqA = wordFrequency(tokenize(textA));
  const freqB = wordFrequency(tokenize(textB));

  const shared: Array<{ word: string; combined: number }> = [];
  for (const [word, countA] of freqA) {
    if (freqB.has(word)) {
      shared.push({ word, combined: countA + freqB.get(word)! });
    }
  }

  return shared
    .sort((x, y) => y.combined - x.combined)
    .slice(0, maxWords)
    .map((entry) => entry.word);
}

export function isGapNode(node: TopicNode): boolean {
  return node.flashcardCount === 0 && node.quizCount === 0;
}

const CLUSTER_STOPWORDS = new Set([
  ...BASE_STOPWORDS,
  "study","topic","pack","chapter","section","unit","introduction","overview",
  "basic","basics","advanced","general",
]);

export function getClusterName(nodes: TopicNode[]): string {
  const words = nodes
    .map((n) => n.name)
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !CLUSTER_STOPWORDS.has(w));

  if (words.length === 0) return "";

  const freq = new Map<string, number>();
  for (const word of words) {
    freq.set(word, (freq.get(word) ?? 0) + 1);
  }

  let best = "";
  let bestCount = 0;
  for (const [word, count] of freq) {
    if (count > bestCount) {
      best = word;
      bestCount = count;
    }
  }

  return best ? best[0].toUpperCase() + best.slice(1) : "";
}

export function computeDecayAlpha(
  lastActivityMs: number | null,
  maxAgeDays = 14
): number {
  if (lastActivityMs === null) return 0.3;

  const msPerDay = 86_400_000;
  const daysAgo = (Date.now() - lastActivityMs) / msPerDay;

  if (daysAgo <= 0) return 1.0;

  const alpha = 1.0 - (daysAgo / maxAgeDays) * 0.7;
  return Math.min(1.0, Math.max(0.3, alpha));
}
