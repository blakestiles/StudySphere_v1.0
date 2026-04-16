"use client";

import { use, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SharePack {
  _id: string;
  title: string;
  summaries: { short?: string; detailed?: string };
  topicCount: number;
  flashcardCount: number;
  createdAt: string;
}

export default function SharedStudyPackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pack, setPack] = useState<SharePack | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cloning, setCloning] = useState(false);

  useEffect(() => {
    fetch(`/api/study-packs/share/${token}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (data?.pack) setPack(data.pack);
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function handleClone() {
    if (!pack) return;
    setCloning(true);
    try {
      const res = await fetch(`/api/study-packs/${pack._id}/clone`, { method: "POST" });
      if (!res.ok) throw new Error("Clone failed");
      const data = await res.json();
      router.push(`/study-packs/${data.studyPack._id}`);
    } catch {
      setCloning(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (notFound || !pack) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center bg-background">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-foreground">Study pack not available</h1>
        <p className="text-muted-foreground max-w-sm">
          This study pack is not available or the link has expired.
        </p>
        <Link href="/" className="mt-2 text-sm text-orange-500 hover:underline">
          Go home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-2.5 py-0.5 text-xs font-medium text-orange-500 border border-orange-500/20">
              Shared
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-foreground">{pack.title}</h1>
          {pack.summaries?.short && (
            <p className="mt-3 text-muted-foreground leading-relaxed">{pack.summaries.short}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h10" />
              </svg>
              {pack.topicCount} Topic{pack.topicCount !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {pack.flashcardCount} Flashcard{pack.flashcardCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Action */}
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          {status === "authenticated" ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Clone this study pack to your library to use it.
              </p>
              <button
                onClick={handleClone}
                disabled={cloning}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 transition-colors"
              >
                {cloning ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Cloning...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Clone to my library
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Sign in to clone this study pack to your library.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
              >
                Sign in to clone
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
