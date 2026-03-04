"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Shuffle, RotateCcw, Play, CheckCircle2, XCircle, Star, Timer } from "lucide-react";

interface StudyPackOption {
  _id: string;
  title: string;
}

interface Card {
  _id: string;
  question: string;
  answer: string;
}

interface MatchingGameProps {
  studyPacks: StudyPackOption[];
}

type GamePhase = "setup" | "playing" | "complete";

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MatchingGame({ studyPacks }: MatchingGameProps) {
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [selectedPack, setSelectedPack] = useState("");
  const [pairCount, setPairCount] = useState(6);
  const [loading, setLoading] = useState(false);

  // Game state
  const [cards, setCards] = useState<Card[]>([]);
  const [shuffledTerms, setShuffledTerms] = useState<Card[]>([]);
  const [shuffledDefs, setShuffledDefs] = useState<Card[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [selectedDef, setSelectedDef] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<{ term: string; def: string } | null>(null);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState<Set<string>>(new Set());
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer
  useEffect(() => {
    if (phase === "playing") {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const startGame = async () => {
    if (!selectedPack) {
      toast.error("Please select a study pack");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/matching-game/cards?studyPackId=${selectedPack}&count=${pairCount}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load cards");
      if (data.cards.length < 2) {
        toast.error("Not enough flashcards in this study pack");
        return;
      }
      setCards(data.cards);
      setShuffledTerms(shuffleArray(data.cards));
      setShuffledDefs(shuffleArray(data.cards));
      setMatchedIds(new Set());
      setSelectedTerm(null);
      setSelectedDef(null);
      setScore(0);
      setMistakes(new Set());
      setTimer(0);
      setWrongPair(null);
      setPhase("playing");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error loading cards");
    } finally {
      setLoading(false);
    }
  };

  const checkMatch = useCallback(
    (termId: string, defId: string) => {
      if (termId === defId) {
        // Correct match
        setMatchedIds((prev) => new Set([...prev, termId]));
        const points = mistakes.has(termId) ? 5 : 10;
        setScore((s) => s + points);
        setSelectedTerm(null);
        setSelectedDef(null);

        // Check if game complete
        if (matchedIds.size + 1 === cards.length) {
          if (timerRef.current) clearInterval(timerRef.current);
          setTimeout(() => setPhase("complete"), 400);
        }
      } else {
        // Wrong match
        setWrongPair({ term: termId, def: defId });
        setMistakes((prev) => new Set([...prev, termId]));
        setTimeout(() => {
          setWrongPair(null);
          setSelectedTerm(null);
          setSelectedDef(null);
        }, 600);
      }
    },
    [cards.length, matchedIds.size, mistakes]
  );

  const handleTermClick = (id: string) => {
    if (matchedIds.has(id) || wrongPair) return;
    setSelectedTerm(id);
    if (selectedDef) {
      checkMatch(id, selectedDef);
    }
  };

  const handleDefClick = (id: string) => {
    if (matchedIds.has(id) || wrongPair) return;
    setSelectedDef(id);
    if (selectedTerm) {
      checkMatch(selectedTerm, id);
    }
  };

  const getStars = () => {
    const accuracy = cards.length > 0 ? (cards.length - mistakes.size) / cards.length : 0;
    if (accuracy >= 0.9) return 3;
    if (accuracy >= 0.6) return 2;
    return 1;
  };

  // SETUP PHASE
  if (phase === "setup") {
    return (
      <div className="max-w-md mx-auto mt-8 space-y-6">
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Study Pack
            </label>
            <select
              value={selectedPack}
              onChange={(e) => setSelectedPack(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">Select a study pack...</option>
              {studyPacks.map((sp) => (
                <option key={sp._id} value={sp._id}>
                  {sp.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Number of Pairs
            </label>
            <div className="flex gap-2">
              {[4, 6, 8, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => setPairCount(n)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    pairCount === n
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-background border-border text-foreground hover:bg-muted"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startGame}
            disabled={loading || !selectedPack}
            className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start Game
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // COMPLETE PHASE
  if (phase === "complete") {
    const stars = getStars();
    const maxScore = cards.length * 10;
    return (
      <div className="max-w-md mx-auto mt-8 space-y-6">
        <div className="bg-card border border-border rounded-xl p-6 text-center space-y-4">
          <h2 className="text-xl font-bold text-foreground">Game Complete!</h2>

          <div className="flex justify-center gap-1">
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                className={`h-8 w-8 ${
                  s <= stars ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
                }`}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-muted rounded-lg p-3">
              <div className="text-muted-foreground">Score</div>
              <div className="text-lg font-bold text-foreground">
                {score}/{maxScore}
              </div>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="text-muted-foreground">Time</div>
              <div className="text-lg font-bold text-foreground">{formatTime(timer)}</div>
            </div>
          </div>

          <div className="space-y-2">
            {cards.map((c) => (
              <div
                key={c._id}
                className="flex gap-2 text-xs bg-green-500/10 border border-green-500/30 rounded-lg p-2"
              >
                <span className="font-medium text-foreground flex-1">{c.question}</span>
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <span className="text-muted-foreground flex-1 text-right">{c.answer}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShuffledTerms(shuffleArray(cards));
                setShuffledDefs(shuffleArray(cards));
                setMatchedIds(new Set());
                setSelectedTerm(null);
                setSelectedDef(null);
                setScore(0);
                setMistakes(new Set());
                setTimer(0);
                setWrongPair(null);
                setPhase("playing");
              }}
              className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted flex items-center justify-center gap-2 text-sm font-medium transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Play Again
            </button>
            <button
              onClick={() => setPhase("setup")}
              className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center gap-2 text-sm font-medium transition-colors"
            >
              <Shuffle className="h-4 w-4" />
              New Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PLAYING PHASE
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-foreground font-medium">
            {matchedIds.size} of {cards.length} matched
          </span>
          <span className="text-muted-foreground">Score: {score}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Timer className="h-4 w-4" />
          {formatTime(timer)}
        </div>
      </div>

      {/* Game board */}
      <div className="grid grid-cols-2 gap-4">
        {/* Terms column */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Terms
          </h3>
          {shuffledTerms.map((card) => {
            const isMatched = matchedIds.has(card._id);
            const isSelected = selectedTerm === card._id;
            const isWrong = wrongPair?.term === card._id;

            let classes =
              "w-full text-left rounded-xl border p-3 text-sm transition-all duration-200 ";
            if (isMatched) {
              classes += "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400 cursor-default";
            } else if (isWrong) {
              classes += "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400 animate-shake";
            } else if (isSelected) {
              classes += "bg-blue-500/10 border-blue-500 text-foreground ring-2 ring-blue-500/30";
            } else {
              classes += "bg-blue-500/5 border-blue-500/20 text-foreground hover:border-blue-500/50 cursor-pointer";
            }

            return (
              <button
                key={card._id}
                onClick={() => handleTermClick(card._id)}
                disabled={isMatched}
                className={classes}
              >
                <div className="flex items-center gap-2">
                  {isMatched && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                  {isWrong && <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
                  <span className="line-clamp-2">{card.question}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Definitions column */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Definitions
          </h3>
          {shuffledDefs.map((card) => {
            const isMatched = matchedIds.has(card._id);
            const isSelected = selectedDef === card._id;
            const isWrong = wrongPair?.def === card._id;

            let classes =
              "w-full text-left rounded-xl border p-3 text-sm transition-all duration-200 ";
            if (isMatched) {
              classes += "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400 cursor-default";
            } else if (isWrong) {
              classes += "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400 animate-shake";
            } else if (isSelected) {
              classes += "bg-emerald-500/10 border-emerald-500 text-foreground ring-2 ring-emerald-500/30";
            } else {
              classes += "bg-emerald-500/5 border-emerald-500/20 text-foreground hover:border-emerald-500/50 cursor-pointer";
            }

            return (
              <button
                key={card._id}
                onClick={() => handleDefClick(card._id)}
                disabled={isMatched}
                className={classes}
              >
                <div className="flex items-center gap-2">
                  {isMatched && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                  {isWrong && <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
                  <span className="line-clamp-3">{card.answer}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
