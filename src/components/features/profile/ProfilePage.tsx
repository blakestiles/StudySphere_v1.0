"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { SparklesText } from "@/components/ui/sparkles-text";
import ShineBorder from "@/components/ui/shine-border";
import Meteors from "@/components/ui/meteors";
import { GlowingStarsBackgroundCard, GlowingStarsTitle, GlowingStarsDescription } from "@/components/ui/glowing-stars-card";
import { AnimatedGenerateButton } from "@/components/ui/animated-generate-button";
import BlurFade from "@/components/ui/blur-fade";

/* ── Types ──────────────────────────────────────────── */

interface ProfilePageProps {
  user: {
    name: string;
    email: string;
    bio: string;
    createdAt: string;
    currentStreak: number;
    longestStreak: number;
    totalStudyMinutes: number;
  };
  stats: {
    documentCount: number;
    studyPackCount: number;
    quizCount: number;
    focusSessionCount: number;
    essayCount: number;
    quizAvg: number;
    essayAvg: number;
    totalCardsReviewed: number;
    flashcardMastery: { new: number; learning: number; mastered: number; total: number };
  };
}

/* ── Achievements Definition ────────────────────────── */

interface Achievement {
  id: string;
  label: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

function getAchievements(
  stats: ProfilePageProps["stats"],
  user: ProfilePageProps["user"]
): Achievement[] {
  const hrs = user.totalStudyMinutes / 60;
  return [
    { id: "first-upload", label: "First Upload", description: "Upload your first document", icon: "📄", unlocked: stats.documentCount >= 1 },
    { id: "pack-creator", label: "Pack Creator", description: "Create your first study pack", icon: "📦", unlocked: stats.studyPackCount >= 1 },
    { id: "quiz-taker", label: "Quiz Taker", description: "Complete your first quiz", icon: "✅", unlocked: stats.quizCount >= 1 },
    { id: "quiz-master", label: "Quiz Master", description: "Complete 10 quizzes", icon: "🏆", unlocked: stats.quizCount >= 10 },
    { id: "streak-starter", label: "Streak Starter", description: "Reach a 3-day streak", icon: "🔥", unlocked: user.longestStreak >= 3 },
    { id: "streak-champion", label: "Streak Champion", description: "Reach a 7-day streak", icon: "⚡", unlocked: user.longestStreak >= 7 },
    { id: "streak-legend", label: "Streak Legend", description: "Reach a 30-day streak", icon: "👑", unlocked: user.longestStreak >= 30 },
    { id: "focus-guru", label: "Focus Guru", description: "Complete 10 focus sessions", icon: "🧘", unlocked: stats.focusSessionCount >= 10 },
    { id: "essay-writer", label: "Essay Writer", description: "Write your first essay", icon: "✍️", unlocked: stats.essayCount >= 1 },
    { id: "essay-scholar", label: "Essay Scholar", description: "Write 5 essays", icon: "🎓", unlocked: stats.essayCount >= 5 },
    { id: "card-collector", label: "Card Collector", description: "Review 50 flashcards", icon: "🃏", unlocked: stats.totalCardsReviewed >= 50 },
    { id: "study-1hr", label: "First Hour", description: "Study for 1 hour total", icon: "⏱️", unlocked: hrs >= 1 },
    { id: "study-10hr", label: "Dedicated Learner", description: "Study for 10 hours total", icon: "📚", unlocked: hrs >= 10 },
    { id: "study-50hr", label: "Study Pro", description: "Study for 50 hours total", icon: "💪", unlocked: hrs >= 50 },
    { id: "study-100hr", label: "Study Legend", description: "Study for 100 hours total", icon: "🌟", unlocked: hrs >= 100 },
  ];
}

/* ── Helpers ─────────────────────────────────────────── */

function formatStudyTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

/* ── SVG Icons ──────────────────────────────────────── */

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  );
}

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M12 2c.5 4-2 6-2 10a4 4 0 008 0c0-4-2.5-6-2-10M12 12a2 2 0 00-2 2c0 1.1.9 2 2 2s2-.9 2-2a2 2 0 00-2-2z" />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

/* ── Stat Card ──────────────────────────────────────── */

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color: string;
}) {
  return (
      <div className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
  );
}

/* ── Score Ring ──────────────────────────────────────── */

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-24 w-24">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={radius} fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="6" />
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-foreground">{score}%</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────── */

export default function ProfilePage({ user, stats }: ProfilePageProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [saving, setSaving] = useState(false);
  const { update } = useSession();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const achievements = getAchievements(stats, user);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio }),
      });
      if (!res.ok) {
        toast.error("Failed to update profile");
        return;
      }
      await update({ name });
      toast.success("Profile updated!");
      setEditing(false);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to change password");
        return;
      }
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setChangingPassword(false);
    }
  };

  const { flashcardMastery: fm } = stats;
  const masteryTotal = fm.total || 1;

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* ── Header ──────────────────────────────────── */}
      <ShineBorder color={["#fbbf24", "#f59e0b", "#d97706"]} borderRadius={16} className="p-0">
        <div className="relative overflow-hidden flex flex-col items-center gap-6 sm:flex-row sm:items-start rounded-2xl bg-card p-6">
          <Meteors count={6} className="opacity-30" />
          {/* Avatar */}
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-3xl font-bold text-white shadow-lg">
            {getInitials(user.name)}
          </div>

          <div className="flex-1 text-center sm:text-left">
            {!editing ? (
              <>
                <SparklesText text={name} className="text-2xl font-bold text-white" />
              <p className="text-muted-foreground">{user.email}</p>
              {bio && <p className="mt-2 text-sm text-muted-foreground">{bio}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                Member since {formatDate(user.createdAt)}
              </p>
            </>
          ) : (
            <form onSubmit={handleSave} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-foreground">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bio" className="text-foreground">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-foreground">Email</Label>
                <Input value={user.email} disabled className="bg-muted" />
              </div>
              <div className="flex gap-2">
                <AnimatedGenerateButton
                  isLoading={saving}
                  idleLabel="Save Profile"
                  loadingLabel="Saving..."
                  type="submit"
                  className="w-full mt-4"
                />
                <button
                  type="button"
                  onClick={() => { setEditing(false); setName(user.name); setBio(user.bio); }}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-white/5 hover:text-foreground hover:border-white/20 active:scale-[0.98]"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-white/5 hover:text-foreground hover:border-white/20 active:scale-[0.98]"
            >
              <PencilIcon className="h-4 w-4" />
              Edit Profile
            </button>
          )}
        </div>
      </ShineBorder>

      {/* ── Stats Grid ──────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Overview</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard icon={<ClockIcon className="h-5 w-5" />} value={formatStudyTime(user.totalStudyMinutes)} label="Total Study Time" color="#f97316" />
          <div className="col-span-2 sm:col-span-1">
            <GlowingStarsBackgroundCard className="w-full">
              <GlowingStarsTitle>{user.currentStreak} Day Streak</GlowingStarsTitle>
              <GlowingStarsDescription>Longest: {user.longestStreak} days</GlowingStarsDescription>
            </GlowingStarsBackgroundCard>
          </div>
          <StatCard icon={<FileIcon className="h-5 w-5" />} value={stats.documentCount} label="Documents" color="#3b82f6" />
          <StatCard icon={<BookIcon className="h-5 w-5" />} value={stats.studyPackCount} label="Study Packs" color="#8b5cf6" />
          <StatCard icon={<CheckCircleIcon className="h-5 w-5" />} value={stats.quizCount} label="Quizzes Taken" color="#10b981" />
          <StatCard icon={<TargetIcon className="h-5 w-5" />} value={stats.focusSessionCount} label="Focus Sessions" color="#ec4899" />
        </div>
      </section>

      {/* ── Learning Progress ───────────────────────── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Learning Progress</h2>
        <div className="rounded-xl border border-border bg-card p-5">
          {/* Flashcard mastery bar */}
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Flashcard Mastery</span>
              <span className="text-xs text-muted-foreground">{fm.total} cards total</span>
            </div>
            <div className="flex h-4 overflow-hidden rounded-full bg-muted">
              {fm.mastered > 0 && (
                <div
                  className="bg-emerald-500 transition-all"
                  style={{ width: `${(fm.mastered / masteryTotal) * 100}%` }}
                />
              )}
              {fm.learning > 0 && (
                <div
                  className="bg-amber-400 transition-all"
                  style={{ width: `${(fm.learning / masteryTotal) * 100}%` }}
                />
              )}
              {fm.new > 0 && (
                <div
                  className="bg-blue-400 transition-all"
                  style={{ width: `${(fm.new / masteryTotal) * 100}%` }}
                />
              )}
            </div>
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> Mastered ({fm.mastered})
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-400" /> Learning ({fm.learning})
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-400" /> New ({fm.new})
              </span>
            </div>
          </div>

          {/* Score rings + cards reviewed */}
            <div className="flex flex-wrap items-center justify-around gap-6">
              <ScoreRing score={stats.quizAvg} label="Avg Quiz Score" color="#10b981" />
              <ScoreRing score={stats.essayAvg} label="Avg Essay Score" color="#8b5cf6" />
              <div className="flex flex-col items-center gap-1">
                <span className="text-3xl font-bold text-foreground">{stats.totalCardsReviewed}</span>
                <span className="text-xs text-muted-foreground">Cards Reviewed</span>
              </div>
            </div>
        </div>
      </section>

      {/* ── Achievements ────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Achievements</h2>
          <span className="text-sm text-muted-foreground">
            {unlockedCount} / {achievements.length} unlocked
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {achievements.map((a, index) => (
            <BlurFade key={a.id} delay={index * 0.05}>
                <div
                  className={`relative flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors ${
                    a.unlocked
                      ? "border-orange-500/30 bg-card"
                      : "border-border bg-muted/50 opacity-50"
                  }`}
                >
                  {!a.unlocked && (
                    <div className="absolute right-2 top-2">
                      <LockIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  )}
                  <span className="text-2xl">{a.icon}</span>
                  <span className="text-xs font-semibold text-foreground leading-tight">{a.label}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{a.description}</span>
                </div>
            </BlurFade>
          ))}
        </div>
      </section>

      {/* ── Security ────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Security</h2>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <LockIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Change Password</p>
              <p className="text-xs text-muted-foreground">Update your account password</p>
            </div>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="currentPassword" className="text-sm">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="h-10 bg-background/50 border-border/60 rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="newPassword" className="text-sm">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="h-10 bg-background/50 border-border/60 rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirmNewPassword" className="text-sm">Confirm New Password</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                placeholder="••••••••"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                className="h-10 bg-background/50 border-border/60 rounded-xl"
              />
            </div>
            <button
              type="submit"
              disabled={changingPassword}
              className="mt-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 transition-all duration-200 hover:bg-amber-500/20 hover:border-amber-500/50 active:scale-[0.98] disabled:opacity-50"
            >
              {changingPassword ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
