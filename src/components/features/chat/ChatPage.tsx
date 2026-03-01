"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

/* ── SVG Icons ──────────────────────────────────────── */

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function MicOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" />
      <path d="M17 16.95A7 7 0 015 12v-2m14 0v2c0 .87-.16 1.71-.46 2.49" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function VolumeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
      <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
    </svg>
  );
}

function VolumeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22,2 15,22 11,13 2,9" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M19 13l.75 2.25L22 16l-2.25.75L19 19l-.75-2.25L16 16l2.25-.75L19 13z" />
      <path d="M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5L5 17z" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load threads on mount
  useEffect(() => {
    fetchThreads();
    fetchStudyPacks();
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchThreads() {
    try {
      const res = await fetch("/api/chat/threads");
      if (!res.ok) return;
      const data = await res.json();
      setThreads(data.threads);
    } catch {
      // silent fail
    }
  }

  async function fetchStudyPacks() {
    try {
      const res = await fetch("/api/study-packs");
      if (!res.ok) return;
      const data = await res.json();
      const packs = Array.isArray(data) ? data : data.studyPacks || [];
      setStudyPacks(packs.map((sp: any) => ({ _id: sp._id, title: sp.title })));
    } catch {
      // silent fail
    }
  }

  const fetchMessages = useCallback(async (threadId: string) => {
    try {
      const res = await fetch(`/api/chat/threads/${threadId}/messages`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages);
    } catch {
      // silent fail
    }
  }, []);

  async function createThread(studyPackId?: string) {
    try {
      const res = await fetch("/api/chat/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studyPackId }),
      });
      if (!res.ok) throw new Error("Failed to create thread");
      const data = await res.json();
      setThreads((prev) => [data.thread, ...prev]);
      setSelectedThreadId(data.thread._id);
      setMessages([]);
      setMobileSidebarOpen(false);
    } catch {
      toast.error("Failed to create new chat");
    }
  }

  async function deleteThread(threadId: string) {
    try {
      const res = await fetch(`/api/chat/threads/${threadId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete thread");
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

  async function sendMessage(content: string) {
    if (!content.trim() || isLoading || !selectedThreadId) return;

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
      const res = await fetch(`/api/chat/threads/${selectedThreadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), eli5: eli5Mode }),
      });

      if (!res.ok) throw new Error("Failed to send message");
      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      fetchThreads();
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          _id: "error-" + Date.now(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  }

  // Voice input
  function toggleListening() {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast.error("Speech recognition is not supported in your browser");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue((prev) => prev + transcript);
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch {
      toast.error("Speech recognition is not supported in your browser");
    }
  }

  // Voice output
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

  return (
    <div className="relative flex h-[calc(100vh-7.5rem)] overflow-hidden rounded-xl border border-border bg-background">
      {/* Sidebar overlay for mobile */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── Left sidebar ─────────────────────────────── */}
      <div
        className={`fixed left-0 top-0 z-30 h-full w-72 border-r border-border bg-card transition-transform md:relative md:z-auto md:block md:w-64 md:translate-x-0 lg:w-72 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* New Chat button */}
          <div className="border-b border-border p-3">
            <button
              onClick={() => createThread()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <PlusIcon className="h-4 w-4" />
              New Chat
            </button>
            {studyPacks.length > 0 && (
              <select
                className="mt-3 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                onChange={(e) => {
                  if (e.target.value) createThread(e.target.value);
                  e.target.value = "";
                }}
                defaultValue=""
              >
                <option value="">New chat with study pack...</option>
                {studyPacks.map((sp) => (
                  <option key={sp._id} value={sp._id}>
                    {sp.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Thread list */}
          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 ? (
              <p className="p-4 text-center text-xs text-muted-foreground">
                No chats yet. Start a new one!
              </p>
            ) : (
              threads.map((thread) => (
                <div
                  key={thread._id}
                  className={`group flex cursor-pointer items-start gap-2 border-b border-border px-3 py-3 transition-colors hover:bg-muted/50 ${
                    selectedThreadId === thread._id ? "bg-muted/70" : ""
                  }`}
                  onClick={() => selectThread(thread._id)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{thread.title}</p>
                    {thread.studyPackId && (
                      <p className="truncate text-xs text-muted-foreground">
                        {thread.studyPackId.title}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(thread.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteThread(thread._id);
                    }}
                    className="mt-0.5 rounded p-1 opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Main chat area ───────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {!selectedThreadId ? (
          /* Empty state */
          <>
            {/* Header bar — in normal flow */}
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <button
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted md:hidden"
                  onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                >
                  <MenuIcon className="h-5 w-5" />
                </button>
                <h2 className="text-lg font-semibold text-foreground">AI Tutor</h2>
              </div>
              <button
                onClick={() => setEli5Mode(!eli5Mode)}
                className="flex items-center gap-2"
              >
                <span className="text-xs font-medium text-muted-foreground">Explain Like I&apos;m 5</span>
                <div className={`relative h-5 w-9 rounded-full transition-colors ${eli5Mode ? "bg-orange-500" : "bg-muted"}`}>
                  <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${eli5Mode ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
              </button>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8">
              <SparklesIcon className="mb-2 h-12 w-12 text-orange-400" />
              <h3 className="text-center text-lg font-semibold text-foreground">
                Ask anything about your study materials
              </h3>
              <p className="text-center text-sm text-muted-foreground">
                Use the mic to record voice notes, or toggle ELI5 for simpler answers
              </p>
              <button
                onClick={() => createThread()}
                className="mt-4 flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-600"
              >
                <PlusIcon className="h-4 w-4" />
                Start a New Chat
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Thread header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <button
                  className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted md:hidden"
                  onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                >
                  <MenuIcon className="h-5 w-5" />
                </button>
                <h3 className="truncate text-base font-semibold text-foreground">
                  AI Tutor
                </h3>
                {selectedThread?.studyPackId && (
                  <p className="truncate text-xs text-muted-foreground">
                    {selectedThread.studyPackId.title}
                  </p>
                )}
              </div>
              <button
                onClick={() => setEli5Mode(!eli5Mode)}
                className="flex items-center gap-2"
              >
                <span className="text-xs font-medium text-muted-foreground">Explain Like I&apos;m 5</span>
                <div className={`relative h-5 w-9 rounded-full transition-colors ${eli5Mode ? "bg-orange-500" : "bg-muted"}`}>
                  <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${eli5Mode ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3">
                  <SparklesIcon className="h-10 w-10 text-orange-400" />
                  <p className="text-sm font-medium text-foreground">
                    Ask anything about your study materials
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Use the mic to record voice notes, or toggle ELI5 for simpler answers
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                          msg.role === "user"
                            ? "bg-orange-500 text-white"
                            : "border border-border bg-card text-foreground"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-li:my-0.5">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                        {msg.role === "assistant" && !msg._id.startsWith("error-") && (
                          <button
                            onClick={() => toggleSpeech(msg._id, msg.content)}
                            className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                          >
                            {speakingMessageId === msg._id ? (
                              <>
                                <VolumeOffIcon className="h-3.5 w-3.5" /> Stop
                              </>
                            ) : (
                              <>
                                <VolumeIcon className="h-3.5 w-3.5" /> Listen
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                        <span className="inline-flex gap-1">
                          <span className="animate-bounce">.</span>
                          <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>.</span>
                          <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>.</span>
                        </span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="border-t border-border px-4 py-3">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
                <button
                  onClick={toggleListening}
                  className={`flex-shrink-0 rounded-lg p-2 transition-colors ${
                    isListening
                      ? "bg-red-500/20 text-red-400"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  title={isListening ? "Stop listening" : "Voice input"}
                >
                  {isListening ? (
                    <MicOffIcon className="h-4 w-4" />
                  ) : (
                    <MicIcon className="h-4 w-4" />
                  )}
                </button>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your study material..."
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                />
                <button
                  onClick={() => sendMessage(inputValue)}
                  disabled={!inputValue.trim() || isLoading}
                  className="flex-shrink-0 rounded-lg bg-orange-500 p-2 text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <SendIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
