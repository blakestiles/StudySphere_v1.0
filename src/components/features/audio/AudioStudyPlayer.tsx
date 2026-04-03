"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Loader2, Headphones, ListMusic, ChevronRight,
} from "lucide-react";
import CustomSelect from "@/components/ui/custom-select";

interface StudyPackOption {
  _id: string;
  title: string;
}

interface Segment {
  title: string;
  text: string;
}

interface PackDetail {
  summaries?: { short?: string; detailed?: string };
  topics?: { name: string; content: string }[];
}

type PlayerPhase = "setup" | "loading" | "ready";

/* ── Waveform bars (playing indicator) ─────────────── */
function WaveformBars({ active }: { active: boolean }) {
  return (
    <div className="flex items-end gap-[3px] h-6">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-amber-500"
          animate={active ? {
            height: ["30%", "100%", "50%", "80%", "30%"],
          } : { height: "30%" }}
          transition={active ? {
            repeat: Infinity,
            duration: 0.8,
            ease: "easeInOut",
            delay: i * 0.12,
          } : { duration: 0.3 }}
        />
      ))}
    </div>
  );
}

/* ── Main component ─────────────────────────────────── */
export default function AudioStudyPlayer({ studyPacks }: { studyPacks: StudyPackOption[] }) {
  const [phase, setPhase] = useState<PlayerPhase>("setup");
  const [selectedPack, setSelectedPack] = useState("");
  const [selectedPackTitle, setSelectedPackTitle] = useState("");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState("");
  const [supported, setSupported] = useState(true);
  const [showPlaylist, setShowPlaylist] = useState(false);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setSupported(false);
      return;
    }
    synthRef.current = window.speechSynthesis;

    const loadVoices = () => {
      const v = synthRef.current!.getVoices();
      setVoices(v);
      if (v.length > 0 && !selectedVoiceURI) {
        const english = v.find((voice) => voice.lang.startsWith("en"));
        setSelectedVoiceURI(english?.voiceURI || v[0].voiceURI);
      }
    };

    loadVoices();
    synthRef.current.addEventListener("voiceschanged", loadVoices);
    return () => {
      synthRef.current?.removeEventListener("voiceschanged", loadVoices);
      synthRef.current?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPack = async () => {
    if (!selectedPack) { toast.error("Please select a study pack"); return; }
    const title = studyPacks.find((p) => p._id === selectedPack)?.title ?? "";
    setSelectedPackTitle(title);
    setPhase("loading");
    try {
      const res = await fetch(`/api/study-packs/${selectedPack}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");

      const segs: Segment[] = [];
      if (data.studyPack?.summaries?.detailed) {
        segs.push({ title: "Summary", text: data.studyPack.summaries.detailed });
      }
      if (data.topics && Array.isArray(data.topics)) {
        for (const t of data.topics) {
          if (t.content) segs.push({ title: t.name, text: t.content });
        }
      }

      if (segs.length === 0) {
        toast.error("No content found in this study pack");
        setPhase("setup");
        return;
      }

      setSegments(segs);
      setCurrentIndex(0);
      setIsPlaying(false);
      setPhase("ready");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error loading pack");
      setPhase("setup");
    }
  };

  const speak = useCallback(
    (text: string) => {
      if (!synthRef.current) return;
      synthRef.current.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = speed;
      const voice = voices.find((v) => v.voiceURI === selectedVoiceURI);
      if (voice) utt.voice = voice;
      utt.onend = () => {
        setCurrentIndex((prev) => {
          const next = prev + 1;
          if (next < segments.length) return next;
          setIsPlaying(false);
          return prev;
        });
      };
      utteranceRef.current = utt;
      synthRef.current.speak(utt);
    },
    [speed, voices, selectedVoiceURI, segments.length]
  );

  useEffect(() => {
    if (phase !== "ready") return;
    if (isPlaying && segments[currentIndex]) {
      speak(segments[currentIndex].text);
    } else {
      synthRef.current?.cancel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentIndex, phase]);

  useEffect(() => {
    if (isPlaying && segments[currentIndex]) speak(segments[currentIndex].text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed, selectedVoiceURI]);

  const togglePlay = () => {
    if (!synthRef.current) return;
    if (isPlaying) { synthRef.current.cancel(); setIsPlaying(false); }
    else setIsPlaying(true);
  };

  const prevSegment = () => {
    if (currentIndex > 0) {
      const wasPlaying = isPlaying;
      synthRef.current?.cancel();
      setIsPlaying(false);
      setCurrentIndex((i) => i - 1);
      if (wasPlaying) setTimeout(() => setIsPlaying(true), 50);
    }
  };

  const nextSegment = () => {
    if (currentIndex < segments.length - 1) {
      const wasPlaying = isPlaying;
      synthRef.current?.cancel();
      setIsPlaying(false);
      setCurrentIndex((i) => i + 1);
      if (wasPlaying) setTimeout(() => setIsPlaying(true), 50);
    }
  };

  const jumpTo = (idx: number) => {
    const wasPlaying = isPlaying;
    synthRef.current?.cancel();
    setIsPlaying(false);
    setCurrentIndex(idx);
    if (wasPlaying) setTimeout(() => setIsPlaying(true), 50);
  };

  /* ── Not supported ───────────────────────────────── */
  if (!supported) {
    return (
      <div className="max-w-md mx-auto mt-8 rounded-2xl border border-border/60 bg-card p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 border border-border/50 mx-auto mb-4">
          <VolumeX className="h-6 w-6 text-muted-foreground/50" />
        </div>
        <p className="font-semibold text-foreground">Audio Not Supported</p>
        <p className="text-sm text-muted-foreground mt-1">
          Your browser does not support the SpeechSynthesis API.
        </p>
      </div>
    );
  }

  /* ── Setup ───────────────────────────────────────── */
  if (phase === "setup") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-md mx-auto"
      >
        {/* Hero card */}
        <div className="relative rounded-2xl border border-amber-500/20 bg-card overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.06] via-transparent to-orange-500/[0.04] pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-orange-400 to-transparent" />

          <div className="relative p-7 text-center">
            {/* Icon */}
            <div className="relative mx-auto mb-5 h-16 w-16">
              <div className="absolute inset-0 rounded-2xl bg-amber-500/20 blur-2xl" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/25">
                <Headphones className="h-7 w-7 text-amber-500" />
              </div>
            </div>

            <h2 className="font-display text-lg font-semibold text-foreground mb-1">
              Choose Your Study Pack
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Your material will be read aloud, segment by segment.
            </p>

            {studyPacks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 py-6 text-center">
                <p className="text-sm text-muted-foreground">No ready study packs yet.</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">Upload a document to generate one.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <CustomSelect
                  value={selectedPack}
                  onValueChange={setSelectedPack}
                  options={[
                    { value: "", label: "Select a study pack…" },
                    ...studyPacks.map((sp) => ({ value: sp._id, label: sp.title })),
                  ]}
                />
                <button
                  onClick={loadPack}
                  disabled={!selectedPack}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 px-4 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_2px_12px_oklch(0.76_0.17_62_/_30%)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Volume2 className="h-4 w-4" />
                  Load & Play
                </button>
              </div>
            )}
          </div>

          {/* Feature chips */}
          <div className="border-t border-border/40 px-7 py-4 flex items-center justify-center gap-4 flex-wrap">
            {[
              { label: "Auto-advance" },
              { label: "Speed control" },
              { label: "Voice selection" },
            ].map((f) => (
              <span key={f.label} className="text-[11px] font-medium text-muted-foreground/60 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500/60" />
                {f.label}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  /* ── Loading ─────────────────────────────────────── */
  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-xl" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20">
            <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Loading study material…</p>
          <p className="text-xs text-muted-foreground mt-0.5">Building your audio segments</p>
        </div>
      </div>
    );
  }

  /* ── Player ──────────────────────────────────────── */
  const current = segments[currentIndex];
  const progress = segments.length > 0 ? ((currentIndex + 1) / segments.length) * 100 : 0;
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="player"
        initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-2xl mx-auto space-y-4"
      >
        {/* ── Now Playing card ───────────────────────── */}
        <div className="relative rounded-2xl border border-amber-500/20 bg-card overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.06] via-transparent to-orange-500/[0.03] pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-orange-400 to-transparent" />

          <div className="relative p-6">
            {/* Top row: pack name + change */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/15 border border-amber-500/25">
                  <Headphones className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <span className="text-xs font-medium text-muted-foreground/70 truncate max-w-[200px]">
                  {selectedPackTitle}
                </span>
              </div>
              <button
                onClick={() => { synthRef.current?.cancel(); setIsPlaying(false); setPhase("setup"); }}
                className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                Change pack
              </button>
            </div>

            {/* Waveform + segment info */}
            <div className="flex items-start gap-5 mb-5">
              {/* Animated art */}
              <div className="relative shrink-0">
                <div className={`absolute inset-0 rounded-2xl blur-xl transition-all duration-700 ${isPlaying ? "bg-amber-500/25" : "bg-amber-500/10"}`} />
                <div className={`relative flex h-20 w-20 items-center justify-center rounded-2xl border transition-all duration-300 ${
                  isPlaying
                    ? "bg-gradient-to-br from-amber-500/25 to-orange-500/15 border-amber-500/40"
                    : "bg-gradient-to-br from-amber-500/15 to-orange-500/8 border-amber-500/20"
                }`}>
                  <WaveformBars active={isPlaying} />
                </div>
              </div>

              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500/60">
                    Now Playing
                  </span>
                  <span className="text-[10px] text-muted-foreground/40 tabular-nums">
                    {currentIndex + 1} / {segments.length}
                  </span>
                </div>
                <h2 className="font-display text-xl font-bold text-foreground leading-tight mb-2 line-clamp-2">
                  {current.title}
                </h2>
                {/* Amber progress bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted/60 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground/40 tabular-nums shrink-0">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Content preview */}
            <div className="rounded-xl bg-muted/30 border border-border/40 px-4 py-3 max-h-28 overflow-y-auto">
              <p className="text-[12.5px] text-muted-foreground leading-relaxed">
                {current.text}
              </p>
            </div>
          </div>
        </div>

        {/* ── Controls card ──────────────────────────── */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-5">
          {/* Play controls */}
          <div className="flex items-center justify-center gap-5">
            <button
              onClick={prevSegment}
              disabled={currentIndex === 0}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-muted/30 text-foreground hover:bg-muted hover:border-border transition-all disabled:opacity-30"
            >
              <SkipBack className="h-4.5 w-4.5" />
            </button>

            {/* Large play/pause */}
            <button
              onClick={togglePlay}
              className="relative group flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-[0_4px_20px_oklch(0.76_0.17_62_/_35%)] hover:shadow-[0_6px_24px_oklch(0.76_0.17_62_/_45%)] hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <AnimatePresence mode="wait">
                {isPlaying ? (
                  <motion.div key="pause" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Pause className="h-6 w-6" />
                  </motion.div>
                ) : (
                  <motion.div key="play" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Play className="h-6 w-6 ml-0.5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            <button
              onClick={nextSegment}
              disabled={currentIndex === segments.length - 1}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-muted/30 text-foreground hover:bg-muted hover:border-border transition-all disabled:opacity-30"
            >
              <SkipForward className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Speed + Voice row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Speed */}
            <div>
              <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-2">Speed</p>
              <div className="flex gap-1">
                {speeds.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                      speed === s
                        ? "bg-amber-500 text-white border-amber-500 shadow-[0_2px_6px_oklch(0.76_0.17_62_/_30%)]"
                        : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>

            {/* Voice */}
            {voices.length > 0 && (
              <div>
                <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-2">Voice</p>
                <CustomSelect
                  value={selectedVoiceURI}
                  onValueChange={setSelectedVoiceURI}
                  options={voices.map((v) => ({ value: v.voiceURI, label: `${v.name} (${v.lang})` }))}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Playlist ───────────────────────────────── */}
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          {/* Header */}
          <button
            onClick={() => setShowPlaylist(!showPlaylist)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ListMusic className="h-4 w-4 text-muted-foreground/60" />
              <span className="text-[13px] font-medium text-foreground">
                Segments
              </span>
              <span className="text-[11px] text-muted-foreground/50 tabular-nums">
                ({segments.length})
              </span>
            </div>
            <motion.div
              animate={{ rotate: showPlaylist ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            </motion.div>
          </button>

          <AnimatePresence>
            {showPlaylist && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="border-t border-border/40 divide-y divide-border/30 max-h-52 overflow-y-auto">
                  {segments.map((seg, idx) => {
                    const isActive = idx === currentIndex;
                    return (
                      <button
                        key={idx}
                        onClick={() => jumpTo(idx)}
                        className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${
                          isActive ? "bg-amber-500/8" : "hover:bg-muted/40"
                        }`}
                      >
                        {/* Track number / playing indicator */}
                        <div className="shrink-0 w-5 text-center">
                          {isActive && isPlaying ? (
                            <WaveformBars active />
                          ) : (
                            <span className={`text-[11px] font-mono tabular-nums ${isActive ? "text-amber-500 font-bold" : "text-muted-foreground/40"}`}>
                              {String(idx + 1).padStart(2, "0")}
                            </span>
                          )}
                        </div>

                        <span className={`text-[12.5px] font-medium truncate flex-1 ${isActive ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground/70"}`}>
                          {seg.title}
                        </span>

                        {isActive && (
                          <span className="shrink-0 text-[10px] font-medium text-amber-500/70 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5">
                            playing
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
