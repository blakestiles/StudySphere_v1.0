"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Loader2,
} from "lucide-react";
import ShimmerButton from "@/components/ui/shimmer-button";
import TextShimmer from "@/components/ui/text-shimmer";
import BlurFade from "@/components/ui/blur-fade";
import AnimatedGridPattern from "@/components/ui/animated-grid-pattern";
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

export default function AudioStudyPlayer({
  studyPacks,
}: {
  studyPacks: StudyPackOption[];
}) {
  const [phase, setPhase] = useState<PlayerPhase>("setup");
  const [selectedPack, setSelectedPack] = useState("");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState("");
  const [supported, setSupported] = useState(true);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check support and load voices
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
        // Prefer an English voice
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
    if (!selectedPack) {
      toast.error("Please select a study pack");
      return;
    }
    setPhase("loading");
    try {
      const res = await fetch(`/api/study-packs/${selectedPack}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");

      const segs: Segment[] = [];
      if (data.studyPack?.summaries?.detailed) {
        segs.push({
          title: "Summary",
          text: data.studyPack.summaries.detailed,
        });
      }
      if (data.topics && Array.isArray(data.topics)) {
        for (const t of data.topics) {
          if (t.content) {
            segs.push({ title: t.name, text: t.content });
          }
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
        // Auto-advance to next segment
        setCurrentIndex((prev) => {
          const next = prev + 1;
          if (next < segments.length) {
            // Will trigger speak via effect
            return next;
          }
          setIsPlaying(false);
          return prev;
        });
      };

      utteranceRef.current = utt;
      synthRef.current.speak(utt);
    },
    [speed, voices, selectedVoiceURI, segments.length]
  );

  // Play current segment when isPlaying changes or segment changes
  useEffect(() => {
    if (phase !== "ready") return;
    if (isPlaying && segments[currentIndex]) {
      speak(segments[currentIndex].text);
    } else {
      synthRef.current?.cancel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentIndex, phase]);

  // Update rate on existing utterance when speed changes
  useEffect(() => {
    if (isPlaying && segments[currentIndex]) {
      speak(segments[currentIndex].text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed, selectedVoiceURI]);

  const togglePlay = () => {
    if (!synthRef.current) return;
    if (isPlaying) {
      synthRef.current.cancel();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  };

  const prevSegment = () => {
    if (currentIndex > 0) {
      const wasPlaying = isPlaying;
      synthRef.current?.cancel();
      setIsPlaying(false);
      setCurrentIndex((i) => i - 1);
      if (wasPlaying) {
        setTimeout(() => setIsPlaying(true), 50);
      }
    }
  };

  const nextSegment = () => {
    if (currentIndex < segments.length - 1) {
      const wasPlaying = isPlaying;
      synthRef.current?.cancel();
      setIsPlaying(false);
      setCurrentIndex((i) => i + 1);
      if (wasPlaying) {
        setTimeout(() => setIsPlaying(true), 50);
      }
    }
  };

  if (!supported) {
    return (
      <div className="max-w-md mx-auto mt-8 bg-card border border-border rounded-xl p-6 text-center">
        <VolumeX className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-foreground font-medium">Audio Not Supported</p>
        <p className="text-sm text-muted-foreground mt-1">
          Your browser does not support the SpeechSynthesis API.
        </p>
      </div>
    );
  }

  // SETUP
  if (phase === "setup") {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Study Pack
            </label>
            <CustomSelect
              value={selectedPack}
              onValueChange={setSelectedPack}
              options={[
                { value: "", label: "Select a study pack..." },
                ...studyPacks.map((sp) => ({ value: sp._id, label: sp.title })),
              ]}
              placeholder="Select a study pack..."
            />
          </div>

          <button
            onClick={loadPack}
            disabled={!selectedPack}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/25 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100"
          >
            <Volume2 className="h-4 w-4" />
            Load Study Material
          </button>
        </div>
      </div>
    );
  }

  // LOADING
  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
        <p className="text-sm text-muted-foreground">Loading study material...</p>
      </div>
    );
  }

  // PLAYER
  const current = segments[currentIndex];
  const progress = segments.length > 0 ? ((currentIndex + 1) / segments.length) * 100 : 0;
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div className="relative max-w-2xl mx-auto space-y-4">
      <AnimatedGridPattern className="absolute inset-0 opacity-[0.06] pointer-events-none" numSquares={15} />

      {/* Segment info */}
      <div className="h-full p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground">
            Segment {currentIndex + 1} of {segments.length}
          </span>
          <button
            onClick={() => {
              synthRef.current?.cancel();
              setIsPlaying(false);
              setPhase("setup");
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Change Pack
          </button>
        </div>

        <h2 className="mb-3">
          <TextShimmer className="text-xl font-bold text-white">{current.title}</TextShimmer>
        </h2>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-orange-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Text display */}
        <div className="max-h-48 overflow-y-auto text-sm text-muted-foreground leading-relaxed">
          {current.text}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <BlurFade delay={0.2}>
        {/* Play controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={prevSegment}
            disabled={currentIndex === 0}
            className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 text-foreground transition-colors hover:scale-110 active:scale-90 transition-transform duration-150"
          >
            <SkipBack className="h-5 w-5" />
          </button>

          <ShimmerButton onClick={togglePlay} className="w-16 h-16 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-150 hover:shadow-md hover:shadow-orange-500/20">
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-0.5" />
            )}
          </ShimmerButton>

          <button
            onClick={nextSegment}
            disabled={currentIndex === segments.length - 1}
            className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 text-foreground transition-colors hover:scale-110 active:scale-90 transition-transform duration-150"
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>

        {/* Speed control */}
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">
            Speed
          </label>
          <div className="flex gap-1.5">
            {speeds.map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  speed === s
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-background border-border text-foreground hover:bg-muted"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Voice selector */}
        {voices.length > 0 && (
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">
              Voice
            </label>
            <CustomSelect
              value={selectedVoiceURI}
              onValueChange={setSelectedVoiceURI}
              options={voices.map((v) => ({ value: v.voiceURI, label: `${v.name} (${v.lang})` }))}
              placeholder="Default voice"
            />
          </div>
        )}

        {/* Segment list */}
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">
            Segments
          </label>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {segments.map((seg, idx) => (
              <button
                key={idx}
                onClick={() => {
                  const wasPlaying = isPlaying;
                  synthRef.current?.cancel();
                  setIsPlaying(false);
                  setCurrentIndex(idx);
                  if (wasPlaying) {
                    setTimeout(() => setIsPlaying(true), 50);
                  }
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                  idx === currentIndex
                    ? "bg-orange-500/10 border border-orange-500/30 text-foreground font-medium"
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                {idx + 1}. {seg.title}
              </button>
            ))}
          </div>
        </div>
        </BlurFade>
      </div>
    </div>
  );
}
