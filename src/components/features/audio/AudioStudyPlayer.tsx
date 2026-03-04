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

          <button
            onClick={loadPack}
            disabled={!selectedPack}
            className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
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
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Segment info */}
      <div className="bg-card border border-border rounded-xl p-5">
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

        <h2 className="text-lg font-semibold text-foreground mb-3">
          {current.title}
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
        {/* Play controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={prevSegment}
            disabled={currentIndex === 0}
            className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 text-foreground transition-colors"
          >
            <SkipBack className="h-5 w-5" />
          </button>

          <button
            onClick={togglePlay}
            className="h-14 w-14 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-colors"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-0.5" />
            )}
          </button>

          <button
            onClick={nextSegment}
            disabled={currentIndex === segments.length - 1}
            className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 text-foreground transition-colors"
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
            <select
              value={selectedVoiceURI}
              onChange={(e) => setSelectedVoiceURI(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground"
            >
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
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
      </div>
    </div>
  );
}
