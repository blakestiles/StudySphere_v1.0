"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "motion/react";
import AnimatedGridPattern from "@/components/ui/animated-grid-pattern";
import CustomSelect from "@/components/ui/custom-select";
import {
  Plus, X, Mic, MicOff, Volume2, VolumeX, Send,
  Sparkles, Brain, ClipboardCheck, FileText,
  Layers, Target, CalendarDays, MessageSquare, Menu, BookOpen,
} from "lucide-react";

/* ── Types ──────────────────────────────────────────── */

interface ChatThread {
  _id: string;
  title: string;
  studyPackId: { _id: string; title: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  _id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

/* ── Constants ──────────────────────────────────────── */

const SUGGESTIONS = [
  { label: "Explain a concept", icon: Brain, color: "violet" },
  { label: "Quiz me on this", icon: ClipboardCheck, color: "emerald" },
  { label: "Summarize my notes", icon: FileText, color: "amber" },
  { label: "Create flashcards", icon: Layers, color: "blue" },
  { label: "Find my weak areas", icon: Target, color: "rose" },
  { label: "Build a study plan", icon: CalendarDays, color: "sky" },
] as const;

const chipColors: Record<string, string> = {
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 hover:bg-violet-500/15",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/15",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/15",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/15",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 hover:bg-sky-500/15",
};

/* ── Helpers ────────────────────────────────────────── */

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ── Component ──────────────────────────────────────── */

export default function ChatPage() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [eli5Mode, setEli5Mode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [studyPacks, setStudyPacks] = useState<{ _id: string; title: string }[]>([]);
  const [newChatPack, setNewChatPack] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    fetchThreads();
    fetchStudyPacks();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchThreads() {
    try {
      const res = await fetch("/api/chat/threads");
      if (!res.ok) return;
      const data = await res.json();
      setThreads(data.threads);
    } catch { /* silent */ }
  }

  async function fetchStudyPacks() {
    try {
      const res = await fetch("/api/study-packs");
      if (!res.ok) return;
      const data = await res.json();
      const packs = Array.isArray(data) ? data : data.studyPacks || [];
      setStudyPacks(packs.map((sp: any) => ({ _id: sp._id, title: sp.title })));
    } catch { /* silent */ }
  }

  const fetchMessages = useCallback(async (threadId: string) => {
    try {
      const res = await fetch(`/api/chat/threads/${threadId}/messages`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages);
    } catch { /* silent */ }
  }, []);

  async function createThread(studyPackId?: string): Promise<string | null> {
    try {
      const res = await fetch("/api/chat/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studyPackId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setThreads((prev) => [data.thread, ...prev]);
      setSelectedThreadId(data.thread._id);
      setMessages([]);
      setMobileSidebarOpen(false);
      return data.thread._id as string;
    } catch {
      toast.error("Failed to create new chat");
      return null;
    }
  }

  async function deleteThread(threadId: string) {
    try {
      const res = await fetch(`/api/chat/threads/${threadId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setThreads((prev) => prev.filter((t) => t._id !== threadId));
      if (selectedThreadId === threadId) {
        setSelectedThreadId(null);
        setMessages([]);
      }
    } catch {
      toast.error("Failed to delete chat");
    }
  }

  function selectThread(threadId: string) {
    setSelectedThreadId(threadId);
    fetchMessages(threadId);
    setMobileSidebarOpen(false);
  }

  async function sendMessage(content: string, threadId?: string) {
    const tid = threadId ?? selectedThreadId;
    if (!content.trim() || isLoading || !tid) return;

    const userMsg: ChatMessage = {
      _id: "temp-" + Date.now(),
      role: "user",
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch(`/api/chat/threads/${tid}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), eli5: eli5Mode }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      fetchThreads();
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          _id: "error-" + Date.now(),
          role: "assistant" as const,
          content: "Sorry, I encountered an error. Please try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleNewAndSend() {
    if (!inputValue.trim()) return;
    const msg = inputValue;
    setInputValue("");
    const tid = await createThread();
    if (!tid) return;
    await sendMessage(msg, tid);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  }

  function toggleListening() {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    try {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR) { toast.error("Speech recognition not supported"); return; }
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";
      rec.onresult = (e: any) => {
        setInputValue((prev) => prev + e.results[0][0].transcript);
        setIsListening(false);
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
      rec.start();
      setIsListening(true);
    } catch {
      toast.error("Speech recognition not supported");
    }
  }

  function toggleSpeech(messageId: string, text: string) {
    if (speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);
    window.speechSynthesis.speak(utterance);
    setSpeakingMessageId(messageId);
  }

  const selectedThread = threads.find((t) => t._id === selectedThreadId);

  /* ── Render ─────────────────────────────────────────── */

  return (
    <div className="relative flex h-[calc(100vh-7.5rem)] overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_2px_16px_oklch(0_0_0_/_8%)]">

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────── */}
      <div className={`fixed left-0 top-0 z-30 h-full w-72 bg-card flex flex-col border-r border-border/60 transition-transform md:relative md:z-auto md:w-64 md:translate-x-0 lg:w-[260px] ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>

        {/* Amber top bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-orange-400 to-transparent" />

        {/* New chat header */}
        <div className="px-3 pt-4 pb-3 border-b border-border/60">
          <button
            onClick={() => createThread()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 px-4 py-2 text-[13px] font-semibold text-white shadow-[0_2px_8px_oklch(0.76_0.17_62_/_25%)] hover:opacity-90 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" />
            New Chat
          </button>
          {studyPacks.length > 0 && (
            <CustomSelect
              value={newChatPack}
              onValueChange={(val) => {
                setNewChatPack("");
                if (val) createThread(val);
              }}
              options={[
                { value: "", label: "Chat about a study pack..." },
                ...studyPacks.map((sp) => ({ value: sp._id, label: sp.title })),
              ]}
              className="mt-2"
            />
          )}
        </div>

        {/* Threads */}
        <div className="flex-1 overflow-y-auto py-1.5">
          {threads.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <MessageSquare className="h-6 w-6 text-muted-foreground/25 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground/40">No chats yet</p>
            </div>
          ) : (
            threads.map((thread, index) => {
              const isActive = selectedThreadId === thread._id;
              return (
                <motion.div
                  key={thread._id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.25 }}
                >
                  <div
                    className={`group relative flex cursor-pointer items-start gap-2.5 px-3 py-2.5 mx-1 my-0.5 rounded-xl transition-colors ${
                      isActive ? "bg-amber-500/10" : "hover:bg-muted/60"
                    }`}
                    onClick={() => selectThread(thread._id)}
                  >
                    {/* Active bar */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-full bg-gradient-to-b from-amber-500 to-orange-500" />
                    )}

                    {/* Icon */}
                    <div className={`shrink-0 mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${
                      isActive
                        ? "bg-amber-500/15 border-amber-500/25 text-amber-500"
                        : "bg-muted/50 border-border/50 text-muted-foreground/50"
                    }`}>
                      <MessageSquare className="h-3.5 w-3.5" />
                    </div>

                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-[12.5px] font-medium leading-snug ${
                        isActive ? "text-foreground" : "text-foreground/75"
                      }`}>
                        {thread.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                        {thread.studyPackId && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400/80 bg-amber-500/8 border border-amber-500/15 rounded px-1.5 py-0.5 max-w-[80px] truncate shrink-0">
                            <BookOpen className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">{thread.studyPackId.title}</span>
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground/35 tabular-nums">
                          {relativeTime(thread.updatedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteThread(thread._id); }}
                      className="shrink-0 mt-0.5 rounded-lg p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 text-muted-foreground/40 transition-all"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Main chat ────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted md:hidden"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </button>

            {selectedThread ? (
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-semibold text-foreground leading-tight">
                  {selectedThread.title}
                </p>
                {selectedThread.studyPackId && (
                  <p className="text-[11px] text-muted-foreground/55 truncate">
                    {selectedThread.studyPackId.title}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <span className="text-[13.5px] font-semibold text-foreground">AI Tutor</span>
              </div>
            )}
          </div>

          {/* ELI5 toggle */}
          <button
            onClick={() => setEli5Mode(!eli5Mode)}
            className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-[11.5px] font-medium transition-all ${
              eli5Mode
                ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                : "bg-muted/40 border-border/50 text-muted-foreground hover:border-border"
            }`}
          >
            <span>ELI5</span>
            <div className={`relative h-4 w-7 rounded-full transition-colors ${eli5Mode ? "bg-amber-500" : "bg-muted-foreground/25"}`}>
              <div className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-200 ${eli5Mode ? "translate-x-3" : "translate-x-0.5"}`} />
            </div>
          </button>
        </div>

        {/* ── No thread: welcome state ─────────────── */}
        {!selectedThreadId ? (
          <div className="flex flex-1 flex-col items-center justify-center p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md space-y-4"
            >
              {/* Icon + heading */}
              <div className="text-center">
                <div className="relative mx-auto mb-4 h-14 w-14">
                  <div className="absolute inset-0 rounded-2xl bg-amber-500/20 blur-2xl" />
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/25">
                    <Sparkles className="h-6 w-6 text-amber-500" />
                  </div>
                </div>
                <h2 className="font-display text-xl font-semibold text-foreground">
                  How can I help you study?
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  I&apos;ve read all your materials. Ask me anything or pick a prompt.
                </p>
              </div>

              {/* Suggestion chips */}
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <motion.button
                      key={s.label}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setInputValue(s.label); inputRef.current?.focus(); }}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${chipColors[s.color]}`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      {s.label}
                    </motion.button>
                  );
                })}
              </div>

              {/* Input */}
              <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-3 py-2 focus-within:border-amber-500/40 focus-within:ring-2 focus-within:ring-amber-500/10 transition-all">
                <button
                  onClick={toggleListening}
                  className={`shrink-0 rounded-lg p-1.5 transition-colors ${isListening ? "bg-red-500/20 text-red-400" : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted"}`}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleNewAndSend(); } }}
                  placeholder="Ask anything — press Enter to start"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                />
                <button
                  onClick={handleNewAndSend}
                  disabled={!inputValue.trim()}
                  className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-[0_2px_6px_oklch(0.76_0.17_62_/_28%)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        ) : (
          <>
            {/* ── Messages ─────────────────────────────── */}
            <div className="relative flex-1 overflow-y-auto p-4">
              <AnimatedGridPattern className="absolute inset-0 opacity-[0.025] pointer-events-none" numSquares={20} />

              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Ask anything about your study materials</p>
                  <p className="text-xs text-muted-foreground">Use mic for voice · toggle ELI5 for simpler answers</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-1 max-w-sm">
                    {SUGGESTIONS.slice(0, 4).map((s) => {
                      const Icon = s.icon;
                      return (
                        <button
                          key={s.label}
                          onClick={() => sendMessage(s.label)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${chipColors[s.color]}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-5 max-w-3xl mx-auto">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg._id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {/* AI avatar */}
                      {msg.role === "assistant" && (
                        <div className="shrink-0 mt-1 flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20">
                          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        </div>
                      )}

                      <div className={`max-w-[82%] flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                        <div className={`rounded-2xl px-4 py-3 text-sm ${
                          msg.role === "user"
                            ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-br-sm"
                            : "border border-border/60 bg-card text-foreground rounded-bl-sm"
                        }`}>
                          {msg.role === "assistant" ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-li:my-0.5">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          )}
                        </div>

                        {msg.role === "assistant" && !msg._id.startsWith("error-") && (
                          <button
                            onClick={() => toggleSpeech(msg._id, msg.content)}
                            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/45 hover:text-muted-foreground transition-colors px-1"
                          >
                            {speakingMessageId === msg._id
                              ? <><VolumeX className="h-3 w-3" /> Stop</>
                              : <><Volume2 className="h-3 w-3" /> Listen</>
                            }
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="shrink-0 mt-1 flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      </div>
                      <div className="rounded-2xl rounded-bl-sm border border-border/60 bg-card px-4 py-3.5">
                        <div className="flex gap-1.5 items-center">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="h-1.5 w-1.5 rounded-full bg-amber-500"
                              animate={{ y: [0, -5, 0] }}
                              transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: i * 0.15 }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* ── Input bar ────────────────────────────── */}
            <div className="border-t border-border/60 px-4 py-3">
              <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-muted/30 px-3 py-2 focus-within:border-amber-500/40 focus-within:ring-2 focus-within:ring-amber-500/10 transition-all max-w-3xl mx-auto">
                <button
                  onClick={toggleListening}
                  className={`shrink-0 rounded-lg p-1.5 transition-colors ${isListening ? "bg-red-500/20 text-red-400" : "text-muted-foreground/45 hover:text-muted-foreground hover:bg-muted"}`}
                  title={isListening ? "Stop listening" : "Voice input"}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your study material…"
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none disabled:opacity-50"
                />
                <button
                  onClick={() => sendMessage(inputValue)}
                  disabled={!inputValue.trim() || isLoading}
                  className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-[0_2px_6px_oklch(0.76_0.17_62_/_28%)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
