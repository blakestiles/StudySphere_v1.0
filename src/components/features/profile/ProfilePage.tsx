"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  Clock, Flame, FileText, BookOpen, CheckCircle2, Target,
  Pencil, Lock, X, Loader2, Trophy, CalendarDays, Mail,
  User, Shield, Check, Star, Zap, GraduationCap, PenLine,
  Timer, CreditCard, Crown,
} from "lucide-react";

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

/* ── Achievements ───────────────────────────────────── */

interface Achievement {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  category: "upload" | "streak" | "quiz" | "focus" | "essay" | "cards" | "time";
}

function getAchievements(
  stats: ProfilePageProps["stats"],
  user: ProfilePageProps["user"]
): Achievement[] {
  const hrs = user.totalStudyMinutes / 60;
  return [
    { id: "first-upload", label: "First Upload", description: "Upload your first document", icon: <FileText className="h-5 w-5" />, unlocked: stats.documentCount >= 1, category: "upload" },
    { id: "pack-creator", label: "Pack Creator", description: "Create your first study pack", icon: <BookOpen className="h-5 w-5" />, unlocked: stats.studyPackCount >= 1, category: "upload" },
    { id: "quiz-taker", label: "Quiz Taker", description: "Complete your first quiz", icon: <CheckCircle2 className="h-5 w-5" />, unlocked: stats.quizCount >= 1, category: "quiz" },
    { id: "quiz-master", label: "Quiz Master", description: "Complete 10 quizzes", icon: <Trophy className="h-5 w-5" />, unlocked: stats.quizCount >= 10, category: "quiz" },
    { id: "streak-starter", label: "Streak Starter", description: "Reach a 3-day streak", icon: <Flame className="h-5 w-5" />, unlocked: user.longestStreak >= 3, category: "streak" },
    { id: "streak-champion", label: "Streak Champ", description: "Reach a 7-day streak", icon: <Zap className="h-5 w-5" />, unlocked: user.longestStreak >= 7, category: "streak" },
    { id: "streak-legend", label: "Streak Legend", description: "Reach a 30-day streak", icon: <Crown className="h-5 w-5" />, unlocked: user.longestStreak >= 30, category: "streak" },
    { id: "focus-guru", label: "Focus Guru", description: "Complete 10 focus sessions", icon: <Target className="h-5 w-5" />, unlocked: stats.focusSessionCount >= 10, category: "focus" },
    { id: "essay-writer", label: "Essay Writer", description: "Write your first essay", icon: <PenLine className="h-5 w-5" />, unlocked: stats.essayCount >= 1, category: "essay" },
    { id: "essay-scholar", label: "Essay Scholar", description: "Write 5 essays", icon: <GraduationCap className="h-5 w-5" />, unlocked: stats.essayCount >= 5, category: "essay" },
    { id: "card-collector", label: "Card Collector", description: "Review 50 flashcards", icon: <CreditCard className="h-5 w-5" />, unlocked: stats.totalCardsReviewed >= 50, category: "cards" },
    { id: "study-1hr", label: "First Hour", description: "Study for 1 hour total", icon: <Clock className="h-5 w-5" />, unlocked: hrs >= 1, category: "time" },
    { id: "study-10hr", label: "Dedicated", description: "Study for 10 hours total", icon: <Timer className="h-5 w-5" />, unlocked: hrs >= 10, category: "time" },
    { id: "study-50hr", label: "Study Pro", description: "Study for 50 hours total", icon: <Star className="h-5 w-5" />, unlocked: hrs >= 50, category: "time" },
    { id: "study-100hr", label: "Study Legend", description: "Study for 100 hours total", icon: <Crown className="h-5 w-5" />, unlocked: hrs >= 100, category: "time" },
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

/* ── Stat Card ──────────────────────────────────────── */

function StatCard({
  icon,
  value,
  label,
  iconBg,
  iconColor,
  topBar,
  delay = 0,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  iconBg: string;
  iconColor: string;
  topBar: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-card"
    >
      <div className={`h-[2px] bg-gradient-to-r ${topBar}`} />
      <div className="p-4">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <p className="mt-3 text-2xl font-bold text-foreground">{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      </div>
    </motion.div>
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
            cx="40" cy="40" r={radius} fill="none" stroke={color}
            strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
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

/* ── Input Row ───────────────────────────────────────── */

function InputRow({ id, label, type = "text", value, onChange, disabled, placeholder, icon }: {
  id: string; label: string; type?: string; value: string;
  onChange?: (v: string) => void; disabled?: boolean; placeholder?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50">
            {icon}
          </span>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full rounded-xl border border-border/60 bg-background/60 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${icon ? "pl-9 pr-4" : "px-4"}`}
        />
      </div>
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

  const achievements = useMemo(() => getAchievements(stats, user), [stats, user]);
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
      if (!res.ok) { toast.error("Failed to update profile"); return; }
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
    if (!currentPassword) { toast.error("Current password is required"); return; }
    if (newPassword !== confirmNewPassword) { toast.error("New passwords don't match"); return; }
    if (newPassword.length < 6) { toast.error("New password must be at least 6 characters"); return; }
    setChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to change password"); return; }
      toast.success("Password updated successfully");
      setCurrentPassword(""); setNewPassword(""); setConfirmNewPassword("");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setChangingPassword(false);
    }
  };

  const { flashcardMastery: fm } = stats;
  const masteryTotal = fm.total || 1;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">

      {/* ── Profile Header ──────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-card"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-orange-400 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.04] via-transparent to-transparent pointer-events-none" />

        <div className="relative p-6">
          <AnimatePresence mode="wait">
            {!editing ? (
              <motion.div
                key="view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-5 sm:flex-row sm:items-start"
              >
                {/* Avatar */}
                <div className="relative shrink-0 self-start">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-3xl font-bold text-white shadow-[0_4px_20px_oklch(0.76_0.17_62_/_30%)]">
                    {getInitials(user.name)}
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-emerald-500">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold text-foreground">{name}</h1>
                  <p className="mt-0.5 text-sm text-muted-foreground">{user.email}</p>
                  {bio && <p className="mt-2 text-sm text-muted-foreground/80 leading-relaxed">{bio}</p>}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1 text-[11px] text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      Member since {formatDate(user.createdAt)}
                    </span>
                    {user.currentStreak > 0 && (
                      <span className="flex items-center gap-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 text-[11px] text-orange-600 dark:text-orange-400">
                        <Flame className="h-3 w-3" />
                        {user.currentStreak}-day streak
                      </span>
                    )}
                  </div>
                </div>

                {/* Edit button */}
                <button
                  onClick={() => setEditing(true)}
                  className="flex shrink-0 items-center gap-1.5 self-start rounded-xl border border-border/60 px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Profile
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="edit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSave}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <Pencil className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Edit Profile</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <InputRow id="name" label="Display Name" value={name} onChange={setName} placeholder="Your name" icon={<User className="h-3.5 w-3.5" />} />
                  <InputRow id="email" label="Email" value={user.email} disabled icon={<Mail className="h-3.5 w-3.5" />} />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="bio" className="text-xs font-medium text-muted-foreground">Bio</label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="w-full rounded-xl border border-border/60 bg-background/60 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 px-4 py-2 text-[13px] font-semibold text-white shadow-[0_2px_10px_oklch(0.76_0.17_62_/_25%)] hover:opacity-90 disabled:opacity-60 transition-all"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditing(false); setName(user.name); setBio(user.bio); }}
                    className="flex items-center gap-1.5 rounded-xl border border-border/60 px-4 py-2 text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Streak Hero ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="relative overflow-hidden rounded-2xl border border-orange-500/25 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-orange-500 via-amber-400 to-transparent" />
        <div className="flex flex-col sm:flex-row items-center gap-6 p-5">
          {/* Current streak */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-orange-500/20 blur-lg" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-500/30 bg-orange-500/10">
                <Flame className="h-8 w-8 text-orange-500" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{user.currentStreak}</p>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </div>
          </div>

          <div className="hidden sm:block h-12 w-px bg-border/60" />

          {/* Study time */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{formatStudyTime(user.totalStudyMinutes)}</p>
              <p className="text-xs text-muted-foreground">Total Study Time</p>
            </div>
          </div>

          <div className="hidden sm:block h-12 w-px bg-border/60" />

          {/* Longest streak */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20">
              <Crown className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{user.longestStreak}</p>
              <p className="text-xs text-muted-foreground">Longest Streak</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Stats Grid ───────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Overview</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={<FileText className="h-4 w-4" />} value={stats.documentCount} label="Documents"
            iconBg="bg-blue-500/10 border-blue-500/20" iconColor="text-blue-500" topBar="from-blue-500 via-blue-400 to-transparent" delay={0.07} />
          <StatCard icon={<BookOpen className="h-4 w-4" />} value={stats.studyPackCount} label="Study Packs"
            iconBg="bg-violet-500/10 border-violet-500/20" iconColor="text-violet-500" topBar="from-violet-500 via-purple-400 to-transparent" delay={0.09} />
          <StatCard icon={<CheckCircle2 className="h-4 w-4" />} value={stats.quizCount} label="Quizzes Taken"
            iconBg="bg-emerald-500/10 border-emerald-500/20" iconColor="text-emerald-500" topBar="from-emerald-500 via-green-400 to-transparent" delay={0.11} />
          <StatCard icon={<Target className="h-4 w-4" />} value={stats.focusSessionCount} label="Focus Sessions"
            iconBg="bg-rose-500/10 border-rose-500/20" iconColor="text-rose-500" topBar="from-rose-500 via-pink-400 to-transparent" delay={0.13} />
        </div>
      </section>

      {/* ── Learning Progress ───────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Learning Progress</h2>
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="h-[2px] bg-gradient-to-r from-amber-500 via-orange-400 to-transparent" />
          <div className="p-5 space-y-6">

            {/* Flashcard mastery bar */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <GraduationCap className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Flashcard Mastery</span>
                </div>
                <span className="text-xs text-muted-foreground">{fm.total} cards total</span>
              </div>
              <div className="flex h-3 overflow-hidden rounded-full bg-muted/50">
                {fm.mastered > 0 && (
                  <div className="bg-emerald-500 transition-all" style={{ width: `${(fm.mastered / masteryTotal) * 100}%` }} />
                )}
                {fm.learning > 0 && (
                  <div className="bg-amber-400 transition-all" style={{ width: `${(fm.learning / masteryTotal) * 100}%` }} />
                )}
                {fm.new > 0 && (
                  <div className="bg-blue-400 transition-all" style={{ width: `${(fm.new / masteryTotal) * 100}%` }} />
                )}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  Mastered <span className="font-semibold text-foreground">({fm.mastered})</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                  Learning <span className="font-semibold text-foreground">({fm.learning})</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />
                  New <span className="font-semibold text-foreground">({fm.new})</span>
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/60" />

            {/* Score rings + cards reviewed */}
            <div className="flex flex-wrap items-center justify-around gap-6">
              <ScoreRing score={stats.quizAvg} label="Avg Quiz Score" color="#10b981" />
              <ScoreRing score={stats.essayAvg} label="Avg Essay Score" color="#8b5cf6" />
              <div className="flex flex-col items-center gap-1">
                <span className="text-3xl font-bold text-foreground">{stats.totalCardsReviewed}</span>
                <span className="text-xs text-muted-foreground">Cards Reviewed</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-3xl font-bold text-foreground">{stats.essayCount}</span>
                <span className="text-xs text-muted-foreground">Essays Written</span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Achievements ────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Achievements</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-1">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                {unlockedCount} / {achievements.length}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
          {achievements.map((a, index) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.18 + index * 0.03 }}
              className={`relative flex flex-col items-center gap-2 rounded-xl border p-3.5 text-center transition-all ${
                a.unlocked
                  ? "border-amber-500/25 bg-amber-500/5 hover:border-amber-500/40 hover:bg-amber-500/10"
                  : "border-border/40 bg-muted/20 opacity-45"
              }`}
            >
              {/* Icon badge */}
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                a.unlocked
                  ? "bg-amber-500/10 border-amber-500/25 text-amber-500"
                  : "bg-muted/50 border-border/40 text-muted-foreground/50"
              }`}>
                {a.unlocked ? a.icon : <Lock className="h-4 w-4" />}
              </div>

              {/* Unlocked glow */}
              {a.unlocked && (
                <div className="absolute -top-px left-1/2 -translate-x-1/2 w-16 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full" />
              )}

              <span className="text-[11px] font-semibold text-foreground leading-tight">{a.label}</span>
              <span className="text-[10px] text-muted-foreground leading-tight line-clamp-2">{a.description}</span>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── Security ────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Security</h2>
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="h-[2px] bg-gradient-to-r from-slate-500 via-slate-400 to-transparent" />
          <div className="p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-500/10 border border-slate-500/20">
                <Shield className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Change Password</p>
                <p className="text-xs text-muted-foreground">Keep your account secure</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3">
              <InputRow id="currentPassword" label="Current Password" type="password"
                value={currentPassword} onChange={setCurrentPassword} placeholder="••••••••"
                icon={<Lock className="h-3.5 w-3.5" />} />
              <div className="grid gap-3 sm:grid-cols-2">
                <InputRow id="newPassword" label="New Password" type="password"
                  value={newPassword} onChange={setNewPassword} placeholder="••••••••"
                  icon={<Lock className="h-3.5 w-3.5" />} />
                <InputRow id="confirmNewPassword" label="Confirm New Password" type="password"
                  value={confirmNewPassword} onChange={setConfirmNewPassword} placeholder="••••••••"
                  icon={<Lock className="h-3.5 w-3.5" />} />
              </div>
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-[13px] font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50 disabled:opacity-60 transition-all"
                >
                  {changingPassword ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
                  {changingPassword ? "Updating…" : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
