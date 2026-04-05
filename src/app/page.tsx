"use client";

import Link from "next/link";
import {
  FileText,
  Network,
  Layers,
  Brain,
  MessageSquare,
  PenTool,
  Upload,
  Zap,
  Target,
  Timer,
  CalendarDays,
  BarChart3,
  Map,
  BookOpen,
  Clock,
  Shield,
  Sparkles,
  Cpu,
  LineChart,
  Globe,
  Star,
  ArrowRight,
  GraduationCap,
  ChevronDown,
  ClipboardCheck,
  Bell,
  StickyNote,
  Trophy,
  Puzzle,
  Headphones,
  TrendingUp,
  ScrollText,
  Calculator,
  Store,
  History,
  Search,
  Link2,
  type LucideIcon,
} from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import { useState, useRef, useEffect } from "react";

import FloatingParticles from "@/components/animations/FloatingParticles";
import AnimatedCounter from "@/components/animations/AnimatedCounter";
import ScrollReveal from "@/components/animations/ScrollReveal";
import MagneticElement from "@/components/animations/MagneticElement";
import GradientText from "@/components/animations/GradientText";
import StaggerGrid, { staggerItem } from "@/components/animations/StaggerGrid";
import WordRotate from "@/components/ui/word-rotate";
import ShimmerButton from "@/components/ui/shimmer-button";
import TextShimmer from "@/components/ui/text-shimmer";
import { FloatingPaths } from "@/components/ui/background-paths";
import { LampContainer } from "@/components/ui/lamp";
import DisplayCards from "@/components/ui/display-cards";
import { HoverEffect } from "@/components/ui/hover-effect-cards";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline";
import { SparklesText } from "@/components/ui/sparkles-text";
import { EvervaultCard, Icon as EvervaultIcon } from "@/components/ui/evervault-card";
import {
  GlowingStarsBackgroundCard,
  GlowingStarsTitle,
  GlowingStarsDescription,
} from "@/components/ui/glowing-stars-card";
import { FeatureCarousel } from "@/components/ui/feature-carousel";
import { AnimatedList, NotificationItem } from "@/components/ui/animated-list";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { BounceCardsGrid } from "@/components/ui/bounce-cards";
import { FeatureHighlight } from "@/components/ui/feature-highlight";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { AIChatCard } from "@/components/ui/ai-chat-card";
import { MessageLoadingBubble } from "@/components/ui/message-loading";
import { AIVoiceInput } from "@/components/ui/ai-voice-input";
import { AIStudyPlan } from "@/components/ui/ai-study-plan";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { BrowserMockup } from "@/components/ui/browser-mockup";
import { ScrollParallaxStats } from "@/components/ui/scroll-parallax-stats";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { GradientButton } from "@/components/ui/gradient-button";

/* ─── Data ─── */
const coreFeatures: { icon: LucideIcon; title: string; desc: string; color: string; bg: string }[] = [
  { icon: FileText, title: "Smart Summaries", desc: "AI generates concise and detailed summaries with hierarchical topic outlines from anything you upload.", color: "text-amber-500", bg: "bg-amber-500/10" },
  { icon: Network, title: "Mind Maps", desc: "Visualize how concepts connect with auto-generated interactive knowledge maps.", color: "text-blue-400", bg: "bg-blue-400/10" },
  { icon: Layers, title: "Spaced Repetition Flashcards", desc: "SM-2 algorithm flashcards that adapt to your pace. Rate difficulty and the system schedules optimal reviews.", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { icon: Brain, title: "Adaptive Quizzes", desc: "MCQ quizzes that identify your weak areas and generate targeted questions to close knowledge gaps.", color: "text-violet-400", bg: "bg-violet-400/10" },
  { icon: MessageSquare, title: "AI Tutor", desc: "Chat with an AI that has read every word of your material. Ask anything and get cited, grounded answers.", color: "text-sky-400", bg: "bg-sky-400/10" },
  { icon: PenTool, title: "Practice Essays", desc: "Write essay answers and get AI grading on Accuracy, Depth, Clarity, and Critical Thinking with actionable feedback.", color: "text-rose-400", bg: "bg-rose-400/10" },
  { icon: ClipboardCheck, title: "AI Exam Simulator", desc: "Timed, proctored exams with fullscreen lockdown, tab-switch warnings, and auto-submit to simulate real test conditions.", color: "text-cyan-400", bg: "bg-cyan-400/10" },
  { icon: ScrollText, title: "Cheat Sheet Generator", desc: "Generate condensed 1-4 page exam cheat sheets from any study pack. Download as Markdown instantly.", color: "text-orange-400", bg: "bg-orange-400/10" },
  { icon: Calculator, title: "Grade Calculator", desc: "Enter your current grades and upcoming assignment weights. Calculate exactly what score you need on the final to hit your target grade.", color: "text-lime-400", bg: "bg-lime-400/10" },
];

const powerTools: { icon: LucideIcon; title: string; desc: string; color: string }[] = [
  { icon: Timer, title: "Focus Mode", desc: "Pomodoro timer with animated arcs, AI micro-goals, phase tracking, and session recaps.", color: "text-amber-500" },
  { icon: CalendarDays, title: "AI Study Planner", desc: "Set your exam date and let AI generate a day-by-day study schedule with calendar events auto-created.", color: "text-blue-400" },
  { icon: Map, title: "Knowledge Graph", desc: "Force-directed visualization with orbital rings, breathing auras, and pulsing nodes mapping topics across your library.", color: "text-emerald-400" },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Track study streaks, quiz scores, flashcard accuracy, weak areas, and study time with charts.", color: "text-violet-400" },
  { icon: StickyNote, title: "Cornell Notes", desc: "Rich text editor with cue column, summary sections, and auto-save.", color: "text-amber-400" },
  { icon: Trophy, title: "Goal Tracking", desc: "Set study goals with deadlines, track progress with visual bars, and get AI-powered suggestions.", color: "text-rose-400" },
  { icon: Headphones, title: "Audio Study Mode", desc: "Listen to your study material with text-to-speech, adjustable speed, and voice selection.", color: "text-pink-400" },
  { icon: Bell, title: "Smart Reminders", desc: "AI-generated study alerts with browser notifications so you never miss a review session.", color: "text-teal-400" },
  { icon: TrendingUp, title: "AI Weekly Report", desc: "Automated performance analysis with trends, strengths, weak spots, and recommendations.", color: "text-indigo-400" },
  { icon: CalendarDays, title: "Study Calendar", desc: "Plan and track study sessions with a visual calendar. Never miss a review or study goal.", color: "text-sky-400" },
  { icon: BookOpen, title: "Document Viewer", desc: "Read your uploaded materials with highlighting, annotations, and AI-powered note-taking.", color: "text-lime-400" },
  { icon: ScrollText, title: "Cheat Sheets", desc: "One-click condensed cheat sheets for any study pack. 1-4 pages, AI-written, downloadable.", color: "text-orange-400" },
  { icon: Calculator, title: "Grade Calculator", desc: "What-if calculator for your GPA. Know exactly what you need before exam day.", color: "text-lime-400" },
  { icon: Store, title: "Study Exchange", desc: "Share your study packs with other students or discover packs others have shared.", color: "text-cyan-400" },
  { icon: History, title: "Study History", desc: "Full log of every quiz attempt, exam, focus session, and flashcard review. Track your progress over time.", color: "text-slate-400" },
  { icon: Link2, title: "Smart Import", desc: "Import study material from PDFs, YouTube videos, Google Docs, Google Drive, web URLs, and Notion pages.", color: "text-blue-400" },
  { icon: Target, title: "Weak Area Detection", desc: "AI analyzes every quiz attempt to pinpoint exactly which topics need more attention and auto-prioritizes them.", color: "text-red-400" },
  { icon: Search, title: "Global Search", desc: "Search across all your documents, study packs, notes, and flashcards from anywhere with Cmd+K.", color: "text-purple-400" },
];

const useCases: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: GraduationCap, title: "Exam Prep", desc: "Upload your syllabus, simulate proctored exams, and let AI quiz you until you're exam-ready." },
  { icon: BookOpen, title: "Lecture Review", desc: "Turn lecture slides into flashcards, Cornell notes, and audio summaries. Review in minutes what took hours." },
  { icon: FileText, title: "Research Papers", desc: "Extract key arguments, build knowledge graphs across papers, and practice explaining the material." },
  { icon: Clock, title: "Last-Minute Cramming", desc: "Focus mode + adaptive quizzes + AI-prioritized weak areas + audio study. Maximum results, minimum time." },
  { icon: Trophy, title: "Semester-Long Goals", desc: "Set study goals, track weekly progress with AI reports, and get smart reminders all semester." },
  { icon: Puzzle, title: "Active Recall", desc: "Matching games, fill-in-the-blank challenges, and spaced repetition flashcards — all built into every study pack." },
];

const testimonials = [
  { quote: "Mind maps make complex topics so much clearer. Love this tool!", name: "Alex R.", role: "Engineering", rating: 5 },
  { quote: "Focus mode keeps me on track. No more 3-hour distracted study sessions.", name: "Chen W.", role: "Business", rating: 5 },
  { quote: "Best study app I've ever used. The AI actually understands my material.", name: "Maria G.", role: "Law Student", rating: 5 },
  { quote: "The AI tutor increased my scores by 20%. It's incredible.", name: "David K.", role: "Pre-Med", rating: 5 },
];

const parallaxStats = [
  { value: "35+", label: "AI-powered features", sublabel: "All in one platform", accent: "text-amber-400" },
  { value: "2 min", label: "To generate a study pack", sublabel: "From raw notes to flashcards", accent: "text-emerald-400" },
  { value: "98%", label: "Student satisfaction", sublabel: "Based on user surveys", accent: "text-violet-400" },
  { value: "10×", label: "Faster than manual study", sublabel: "AI does the heavy lifting", accent: "text-rose-400" },
];

const trustItems: { icon: LucideIcon; label: string }[] = [
  { icon: Shield, label: "Your data stays private" },
  { icon: Sparkles, label: "Instant AI generation" },
  { icon: Cpu, label: "Powered by Claude AI" },
  { icon: LineChart, label: "Detailed analytics" },
  { icon: Globe, label: "Study anytime, anywhere" },
];

const carouselFeatures = [
  { id: "focus", label: "Focus Mode", icon: Timer, description: "Pomodoro timer with animated arcs, AI micro-goals, phase tracking, and session recaps to keep you in the zone.", details: ["Customizable work/break intervals", "AI-generated micro-goals per session", "Session history and productivity stats"] },
  { id: "planner", label: "AI Study Planner", icon: CalendarDays, description: "Set your exam date and let AI generate a day-by-day study schedule with calendar events auto-created.", details: ["Adapts to your available hours", "Prioritizes weak areas automatically", "Syncs with study calendar events"] },
  { id: "graph", label: "Knowledge Graph", icon: Map, description: "Force-directed visualization with orbital rings, breathing auras, and pulsing nodes mapping topics across your library.", details: ["Cross-pack topic connections", "Interactive node exploration", "Visual strength indicators"] },
  { id: "analytics", label: "Analytics Dashboard", icon: BarChart3, description: "Track study streaks, quiz scores, flashcard accuracy, weak areas, and study time with interactive charts.", details: ["7-day and 30-day trend views", "Weak area heat maps", "Study time distribution breakdown"] },
  { id: "cornell", label: "Cornell Notes", icon: StickyNote, description: "Rich text editor with cue column, summary sections, and auto-save for structured note-taking.", details: ["TipTap rich text editing", "Cue + summary methodology", "Auto-save every keystroke"] },
  { id: "goals", label: "Goal Tracking", icon: Trophy, description: "Set study goals with deadlines, track progress with visual bars, and get AI-powered goal suggestions.", details: ["Visual progress indicators", "Deadline reminders", "AI suggests achievable targets"] },
  { id: "audio", label: "Audio Study Mode", icon: Headphones, description: "Listen to your study material with text-to-speech, adjustable speed, and voice selection.", details: ["Multiple voice options", "Speed control (0.5x–2x)", "Background playback support"] },
  { id: "reminders", label: "Smart Reminders", icon: Bell, description: "AI-generated study alerts with browser notifications so you never miss a review session.", details: ["Spaced repetition reminders", "Browser push notifications", "Smart scheduling around your habits"] },
  { id: "report", label: "AI Weekly Report", icon: TrendingUp, description: "Automated performance analysis with trends, strengths, weak spots, and personalized recommendations.", details: ["Week-over-week comparisons", "Actionable improvement tips", "Study habit insights"] },
  { id: "calendar", label: "Study Calendar", icon: CalendarDays, description: "Plan and track study sessions with a visual calendar. Never miss a review or study goal.", details: ["Drag-and-drop scheduling", "Color-coded session types", "Integration with study plans"] },
  { id: "docs", label: "Document Viewer", icon: BookOpen, description: "Read your uploaded materials with highlighting, annotations, and AI-powered note-taking.", details: ["In-line highlighting", "Margin annotations", "AI summary sidebar"] },
  { id: "cheatsheet", label: "Cheat Sheets", icon: ScrollText, description: "Generate condensed 1-4 page exam cheat sheets from any study pack, downloadable as Markdown.", details: ["AI selects the most exam-relevant content", "1, 2, 3, or 4 page options", "Download as Markdown instantly"] },
  { id: "gradecalc", label: "Grade Calculator", icon: Calculator, description: "Enter your current grades and upcoming assignment weights to calculate what score you need on the final.", details: ["Works even when weights don't sum to 100%", "What-if slider for scenario planning", "Letter grade display with live updates"] },
  { id: "history", label: "Study History", icon: History, description: "Complete log of every quiz attempt, exam, focus session, and flashcard review with performance trends.", details: ["Quiz and exam score timeline", "Focus session history", "Flashcard review log"] },
  { id: "import", label: "Smart Import", icon: Link2, description: "Import study material from PDFs, YouTube videos, Google Docs, Google Drive files, web URLs, and Notion pages.", details: ["YouTube transcript extraction", "Google Docs & Drive support", "Web page + Notion import"] },
  { id: "weakareas", label: "Weak Area Detection", icon: Target, description: "AI analyzes every quiz attempt to automatically identify which topics need more attention and surface targeted practice.", details: ["Post-quiz automatic analysis", "Topic-level weak area mapping", "Prioritized review suggestions"] },
];

const liveNotifications = [
  { icon: <Brain className="w-4 h-4 text-violet-400" />, name: "Alex completed a quiz", description: "Scored 92% on Organic Chemistry", time: "2m ago", color: "bg-violet-500/10" },
  { icon: <Zap className="w-4 h-4 text-amber-400" />, name: "New study pack generated", description: "Machine Learning Fundamentals — 24 flashcards", time: "5m ago", color: "bg-amber-500/10" },
  { icon: <Timer className="w-4 h-4 text-emerald-400" />, name: "Focus session finished", description: "Maria studied 45 minutes — 3 micro-goals hit", time: "8m ago", color: "bg-emerald-500/10" },
  { icon: <Trophy className="w-4 h-4 text-rose-400" />, name: "Goal achieved!", description: "David hit 7-day study streak", time: "12m ago", color: "bg-rose-500/10" },
  { icon: <Star className="w-4 h-4 text-amber-400" />, name: "Flashcard mastery", description: "Chen mastered 50 cards in Biology 101", time: "15m ago", color: "bg-amber-500/10" },
  { icon: <BarChart3 className="w-4 h-4 text-blue-400" />, name: "Weekly report ready", description: "Your AI analysis for this week is in", time: "20m ago", color: "bg-blue-500/10" },
  { icon: <MessageSquare className="w-4 h-4 text-sky-400" />, name: "AI Tutor answered", description: "Explained quantum superposition in 3 ways", time: "25m ago", color: "bg-sky-500/10" },
  { icon: <PenTool className="w-4 h-4 text-pink-400" />, name: "Essay graded", description: "Sarah got A on Constitutional Law essay", time: "30m ago", color: "bg-pink-500/10" },
  { icon: <ScrollText className="w-4 h-4 text-orange-400" />, name: "Cheat sheet ready", description: "2-page cheat sheet for Organic Chemistry generated", time: "3m ago", color: "bg-orange-500/10" },
];

const bounceCards = [
  { icon: Upload, title: "Upload Once", description: "Drop any PDF, slides, or notes and watch AI transform them into a complete study toolkit.", gradient: "bg-gradient-to-br from-amber-500/80 to-orange-500/80" },
  { icon: Brain, title: "AI Does the Work", description: "Summaries, flashcards, quizzes, mind maps, cloze questions — generated in seconds, not hours.", gradient: "bg-gradient-to-br from-violet-500/80 to-indigo-500/80" },
  { icon: Target, title: "Study Smarter", description: "Spaced repetition, adaptive quizzes, and AI-detected weak areas mean you focus where it matters.", gradient: "bg-gradient-to-br from-emerald-500/80 to-teal-500/80" },
  { icon: Trophy, title: "Ace Every Exam", description: "Proctored exam simulator, progress tracking, and AI weekly reports keep you on the path to A+.", gradient: "bg-gradient-to-br from-rose-500/80 to-pink-500/80" },
];

const interactiveTabs = [
  {
    id: "generate",
    label: "Generate",
    icon: Zap,
    content: (
      <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {[
          { icon: FileText, title: "Smart Summaries", desc: "Hierarchical outlines extracted from your material", color: "text-amber-500" },
          { icon: Layers, title: "Flashcards", desc: "SM-2 spaced repetition cards with difficulty ratings", color: "text-emerald-400" },
          { icon: Brain, title: "Quiz Questions", desc: "MCQ, fill-in-blank, and matching — all AI-generated", color: "text-violet-400" },
          { icon: ScrollText, title: "Cheat Sheets", desc: "1-4 page condensed exam sheets, downloadable as Markdown", color: "text-orange-400" },
          { icon: Link2, title: "Smart Import", desc: "PDF, YouTube, Google Docs, Drive, web URLs, Notion", color: "text-blue-400" },
          { icon: Network, title: "Mind Maps", desc: "Auto-generated topic maps with interactive visualization", color: "text-sky-400" },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-white/[0.06] bg-[#0c0c16] p-6 hover:border-amber-500/20 transition-colors">
            <item.icon className={`w-8 h-8 ${item.color} mb-4`} />
            <h4 className="font-display font-bold text-white mb-2">{item.title}</h4>
            <p className="text-white/40 text-sm">{item.desc}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "practice",
    label: "Practice",
    icon: ClipboardCheck,
    content: (
      <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {[
          { icon: ClipboardCheck, title: "Exam Simulator", desc: "Proctored fullscreen exams with tab-switch detection", color: "text-cyan-400" },
          { icon: PenTool, title: "Practice Essays", desc: "Write answers and get AI grading on 4 criteria", color: "text-rose-400" },
          { icon: Puzzle, title: "Active Recall", desc: "Matching games and fill-in-the-blank challenges", color: "text-pink-400" },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-white/[0.06] bg-[#0c0c16] p-6 hover:border-amber-500/20 transition-colors">
            <item.icon className={`w-8 h-8 ${item.color} mb-4`} />
            <h4 className="font-display font-bold text-white mb-2">{item.title}</h4>
            <p className="text-white/40 text-sm">{item.desc}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "track",
    label: "Track",
    icon: BarChart3,
    content: (
      <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {[
          { icon: BarChart3, title: "Analytics", desc: "Study streaks, quiz scores, and time distribution charts", color: "text-blue-400" },
          { icon: TrendingUp, title: "AI Weekly Report", desc: "Automated performance analysis with recommendations", color: "text-indigo-400" },
          { icon: Trophy, title: "Goal Tracking", desc: "Set targets, track progress, and get AI suggestions", color: "text-amber-500" },
          { icon: Calculator, title: "Grade Calculator", desc: "What-if score calculator to hit your target GPA", color: "text-lime-400" },
          { icon: History, title: "Study History", desc: "Full log of quizzes, exams, sessions, and flashcard reviews", color: "text-slate-400" },
          { icon: Target, title: "Weak Area Detection", desc: "AI identifies your knowledge gaps after every quiz", color: "text-red-400" },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-white/[0.06] bg-[#0c0c16] p-6 hover:border-amber-500/20 transition-colors">
            <item.icon className={`w-8 h-8 ${item.color} mb-4`} />
            <h4 className="font-display font-bold text-white mb-2">{item.title}</h4>
            <p className="text-white/40 text-sm">{item.desc}</p>
          </div>
        ))}
      </div>
    ),
  },
];

const marqueeItems = [
  "Smart Summaries", "Mind Maps", "Spaced Repetition", "Adaptive Quizzes", "AI Tutor",
  "Practice Essays", "Exam Simulator", "Focus Mode", "Study Planner", "Knowledge Graph",
  "Analytics", "Cornell Notes", "Goal Tracking", "Audio Study", "Smart Reminders",
  "Weekly Report", "Study Calendar", "Document Viewer", "Matching Game", "Fill-in-the-Blank",
  "Weak Area Detection", "AI Study Plan", "Flashcard Reviews", "Chat Threads", "Annotations",
  "Cheat Sheet Generator", "Grade Calculator", "Study Exchange", "Google Drive Import",
  "YouTube Import", "Google Docs Import", "Notion Import", "Web URL Import",
  "History", "Weak Area Detection", "Command Palette", "Global Search", "Study Pack Export",
];

export default function LandingPage() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.97]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 40]);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#08080F] text-white overflow-x-hidden">
      {/* ─── Navbar ─── */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
        className={`sticky top-0 z-50 transition-all duration-300 ${
          navScrolled
            ? "bg-[#08080F]/92 backdrop-blur-2xl border-b border-white/[0.06] shadow-xl shadow-black/30"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ rotate: 12, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25"
            >
              <GraduationCap className="w-5 h-5 text-white" />
            </motion.div>
            <span className="font-display text-xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Study</span>
              <span className="text-white">Sphere</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex text-sm text-white/50 hover:text-white transition-colors px-4 py-2"
            >
              Sign In
            </Link>
            <MagneticElement strength={0.15}>
              <GradientButton href="/register">Get Started</GradientButton>
            </MagneticElement>
          </div>
        </div>
      </motion.header>

      {/* ─── Hero ─── */}
      <section ref={heroRef} className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Background Paths — flowing animated SVG curves */}
        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
        <FloatingParticles count={8} />

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="container mx-auto px-5 sm:px-8 text-center relative z-10 max-w-5xl"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
            className="inline-flex items-center gap-2.5 rounded-full border border-amber-500/20 bg-amber-500/[0.06] px-4 py-1.5 text-xs font-medium text-amber-400/90 mb-8 backdrop-blur-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse-dot" />
            26+ AI-powered study tools
            <span className="text-amber-500/40">✦</span>
            Free to start
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.4, 0.25, 1] }}
            className="font-display font-bold tracking-tight leading-[0.92]"
            style={{ fontSize: "clamp(3.2rem, 9vw, 7.5rem)" }}
          >
            Study less.
            <br />
            <WordRotate
              words={["Score MORE.", "Ace exams.", "Learn faster.", "Retain everything."]}
              duration={2800}
              textClassName="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent"
            />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.25, 0.4, 0.25, 1] }}
            className="mt-7 sm:mt-8 text-white/65 text-base sm:text-lg max-w-xl mx-auto leading-relaxed"
          >
            Your notes, slides, or textbooks go in. Flashcards, quizzes,
            summaries, mind maps, exam simulators, and a personal AI tutor
            come out — in seconds.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link href="/register">
              <ShimmerButton className="shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30">
                Start Learning Free
                <ArrowRight className="w-4 h-4" />
              </ShimmerButton>
            </Link>
            <Link href="/login">
              <InteractiveHoverButton text="Sign In" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
            className="mt-16 sm:mt-20"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="w-5 h-5 text-white/20 mx-auto" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="relative border-y border-white/[0.05] bg-[#060610]">
        <div className="absolute inset-0 animate-shimmer opacity-60" />
        <div className="container mx-auto px-5 sm:px-8 py-9 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "4.9", suffix: "★", label: "Average Rating" },
              { value: "50K+", suffix: "", label: "Study Packs Created" },
              { value: "26+", suffix: "", label: "AI-Powered Features" },
              { value: "98%", suffix: "", label: "Student Satisfaction" },
            ].map((stat) => (
              <div key={stat.label} className="group">
                <div className="font-display text-3xl sm:text-4xl font-bold text-amber-400 group-hover:text-amber-300 transition-colors">
                  <AnimatedCounter value={stat.value} />
                  {stat.suffix}
                </div>
                <div className="text-[11px] text-white/35 mt-2 tracking-wider uppercase font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why StudySphere — Feature Highlight ─── */}
      <section className="py-24 sm:py-32 relative">
        <div className="container mx-auto px-5 sm:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <FeatureHighlight
              icon={
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-amber-500" />
                </div>
              }
              title="Stop wasting time on outdated study methods."
              features={[
                <span key="1">Upload your <span className="text-amber-400 font-semibold">notes, slides, or textbooks</span> once.</span>,
                <span key="2">AI generates <span className="text-emerald-400 font-semibold">flashcards, quizzes, summaries</span> instantly.</span>,
                <span key="3">Study with <span className="text-violet-400 font-semibold">spaced repetition</span> that adapts to you.</span>,
                <span key="4">Track progress with <span className="text-sky-400 font-semibold">AI analytics</span> and weekly reports.</span>,
                <span key="5">Ace your exams with a <span className="text-rose-400 font-semibold">proctored simulator</span>.</span>,
              ]}
              footer={
                <Link href="/register">
                  <ShimmerButton className="shadow-lg shadow-amber-500/15 mt-4">
                    Try It Free <ArrowRight className="w-4 h-4" />
                  </ShimmerButton>
                </Link>
              }
            />
            <ScrollReveal>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-amber-500/[0.06] via-transparent to-violet-500/[0.04] rounded-3xl blur-2xl" />
                <div className="relative grid grid-cols-2 gap-3">
                  {[
                    { value: "2min", label: "Average generation time", icon: Zap },
                    { value: "26+", label: "AI-powered features", icon: Cpu },
                    { value: "98%", label: "Student satisfaction", icon: Star },
                    { value: "4.9★", label: "Average rating", icon: Trophy },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-white/[0.06] bg-[#0c0c16] p-5 text-center hover:border-amber-500/20 transition-colors group">
                      <stat.icon className="w-5 h-5 text-amber-500/60 mx-auto mb-3 group-hover:text-amber-400 transition-colors" />
                      <div className="font-display text-2xl font-bold text-white mb-1">{stat.value}</div>
                      <div className="text-white/30 text-[11px] uppercase tracking-wider">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ─── Marquee Feature Strip ─── */}
      <div className="border-b border-white/[0.04] bg-[#06060E] py-3 overflow-hidden">
        <div className="flex items-center gap-10 animate-marquee w-max">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="flex items-center gap-3 text-xs text-white/25 whitespace-nowrap font-medium tracking-wide">
              <span className="w-1 h-1 rounded-full bg-amber-500/40 shrink-0" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ─── Core Features — Hover Effect Cards ─── */}
      <section className="py-24 sm:py-32 relative">
        <div className="container mx-auto px-5 sm:px-8 relative z-10">
          <ScrollReveal>
            <div className="text-center mb-12 sm:mb-16">
              <TextShimmer className="text-[11px] font-semibold uppercase tracking-[0.25em] mb-4 font-display" duration={4}>
                Core Features
              </TextShimmer>
              <h2 className="font-display font-bold leading-tight" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
                Everything you need to{" "}
                <GradientText>ace your exams</GradientText>
              </h2>
              <p className="text-white/40 mt-4 max-w-lg mx-auto text-sm sm:text-base">
                Upload once. StudySphere builds your entire study toolkit in seconds.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <HoverEffect
              className="max-w-5xl mx-auto"
              items={coreFeatures.map((f) => ({
                icon: <f.icon className={`w-5 h-5 ${f.color}`} />,
                title: f.title,
                description: f.desc,
              }))}
            />
          </ScrollReveal>
        </div>
      </section>

      {/* ─── By the Numbers — Scroll Parallax Stats ─── */}
      <section className="bg-[#060610] relative overflow-hidden border-y border-white/[0.04]">
        <ScrollParallaxStats stats={parallaxStats} />
      </section>

      {/* ─── How It Works — Display Cards ─── */}
      <section className="py-24 sm:py-32 bg-[#060610] relative overflow-hidden">
        <div className="container mx-auto px-5 sm:px-8">
          <ScrollReveal>
            <div className="text-center mb-14 sm:mb-16">
              <p className="text-amber-500 text-[11px] font-semibold uppercase tracking-[0.25em] mb-4 font-display">
                Simple as 1-2-3
              </p>
              <h2 className="font-display font-bold" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
                How it works
              </h2>
              <p className="text-white/40 mt-4 text-sm sm:text-base">
                From upload to exam-ready in under 60 seconds
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="flex justify-center">
              <DisplayCards
                cards={[
                  {
                    icon: <Upload className="size-4 text-amber-300" />,
                    title: "Upload anything",
                    description: "PDF, slides, lecture notes, or textbooks",
                    date: "Step 1",
                    iconClassName: "text-amber-500",
                    titleClassName: "text-amber-400",
                    className:
                      "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
                  },
                  {
                    icon: <Zap className="size-4 text-orange-300" />,
                    title: "AI does the heavy lifting",
                    description: "Summaries, flashcards, quizzes & mind maps",
                    date: "Step 2",
                    iconClassName: "text-orange-500",
                    titleClassName: "text-orange-400",
                    className:
                      "[grid-area:stack] translate-x-16 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
                  },
                  {
                    icon: <Target className="size-4 text-emerald-300" />,
                    title: "Study smarter",
                    description: "Spaced repetition, AI tutor & weekly reports",
                    date: "Step 3",
                    iconClassName: "text-emerald-500",
                    titleClassName: "text-emerald-400",
                    className:
                      "[grid-area:stack] translate-x-32 translate-y-20 hover:translate-y-10",
                  },
                ]}
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── App Preview — Browser Mockup ─── */}
      <section className="py-24 sm:py-32 bg-[#060610] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/[0.015] to-transparent pointer-events-none" />
        <div className="container mx-auto px-5 sm:px-8 relative z-10">
          <ScrollReveal>
            <div className="text-center mb-14 sm:mb-16">
              <TextShimmer className="text-[11px] font-semibold uppercase tracking-[0.25em] mb-4 font-display" duration={4}>
                See the Product
              </TextShimmer>
              <h2 className="font-display font-bold" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
                Your complete study{" "}
                <GradientText>command center</GradientText>
              </h2>
              <p className="text-white/40 mt-4 max-w-lg mx-auto text-sm sm:text-base">
                Everything you need in one clean dashboard — study packs, AI suggestions, progress tracking, and more.
              </p>
            </div>
          </ScrollReveal>

          <div className="relative max-w-3xl mx-auto">
            <div className="absolute -inset-12 bg-gradient-to-b from-amber-500/[0.04] via-violet-500/[0.03] to-transparent rounded-[50%] blur-3xl pointer-events-none" />
            <BrowserMockup />
          </div>
        </div>
      </section>

      {/* ─── Power Tools — Bento Grid ─── */}
      <section className="py-24 sm:py-32 relative">
        <div className="container mx-auto px-5 sm:px-8 relative z-10">
          <ScrollReveal>
            <div className="text-center mb-14 sm:mb-16">
              <p className="text-amber-500 text-[11px] font-semibold uppercase tracking-[0.25em] mb-4 font-display">
                Power Tools
              </p>
              <h2 className="font-display font-bold" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
                Go beyond basic studying
              </h2>
              <p className="text-white/40 mt-4 max-w-lg mx-auto text-sm sm:text-base">
                Advanced tools that make StudySphere the most complete study platform ever built.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <BentoGrid className="lg:grid-rows-3 max-w-5xl mx-auto">
              <BentoCard
                name="Focus Mode"
                description="Pomodoro timer with animated arcs, AI micro-goals, phase tracking, and session recaps."
                href="/focus"
                cta="Start Focusing"
                Icon={Timer}
                background={<div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.07] to-transparent" />}
                className="lg:row-start-1 lg:row-end-4 lg:col-start-2 lg:col-end-3"
              />
              <BentoCard
                name="Knowledge Graph"
                description="Force-directed visualization with orbital rings and pulsing nodes mapping topics across your library."
                href="/knowledge-graph"
                cta="Explore Graph"
                Icon={Map}
                background={<div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.05] to-transparent" />}
                className="lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3"
              />
              <BentoCard
                name="Cornell Notes"
                description="Rich text editor with cue column, summary sections, and auto-save."
                href="/notebooks"
                cta="Take Notes"
                Icon={StickyNote}
                background={<div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.05] to-transparent" />}
                className="lg:col-start-1 lg:col-end-2 lg:row-start-3 lg:row-end-4"
              />
              <BentoCard
                name="Analytics Dashboard"
                description="Track study streaks, quiz scores, flashcard accuracy, and study time with interactive charts."
                href="/analytics"
                cta="View Analytics"
                Icon={BarChart3}
                background={<div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.05] to-transparent" />}
                className="lg:col-start-3 lg:col-end-3 lg:row-start-1 lg:row-end-2"
              />
              <BentoCard
                name="Smart Reminders"
                description="AI-generated study alerts with browser notifications so you never miss a review session."
                href="/dashboard"
                cta="Set Reminders"
                Icon={Bell}
                background={<div className="absolute inset-0 bg-gradient-to-br from-rose-500/[0.05] to-transparent" />}
                className="lg:col-start-3 lg:col-end-3 lg:row-start-2 lg:row-end-4"
              />
            </BentoGrid>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Interactive Demo — Animated Tabs ─── */}
      <section className="py-24 sm:py-32 bg-[#060610] relative overflow-hidden">
        <div className="container mx-auto px-5 sm:px-8 relative z-10">
          <ScrollReveal>
            <div className="text-center mb-14 sm:mb-16">
              <p className="text-amber-500 text-[11px] font-semibold uppercase tracking-[0.25em] mb-4 font-display">
                Three Pillars
              </p>
              <h2 className="font-display font-bold" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
                Generate. Practice.{" "}
                <GradientText>Track.</GradientText>
              </h2>
              <p className="text-white/40 mt-4 max-w-lg mx-auto text-sm sm:text-base">
                Click each tab to explore how StudySphere covers every step of your study workflow.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <AnimatedTabs tabs={interactiveTabs} />
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Full Suite — Feature Carousel ─── */}
      <section className="py-24 sm:py-32 bg-[#060610] relative overflow-hidden">
        <div className="container mx-auto px-5 sm:px-8 relative z-10">
          <ScrollReveal>
            <div className="text-center mb-14 sm:mb-16">
              <p className="text-amber-500 text-[11px] font-semibold uppercase tracking-[0.25em] mb-4 font-display">
                The Full Suite
              </p>
              <h2 className="font-display font-bold" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
                Every tool you need,{" "}
                <GradientText>in one place</GradientText>
              </h2>
              <p className="text-white/40 mt-4 max-w-lg mx-auto text-sm sm:text-base">
                11 specialized tools that auto-cycle below. Click any chip to explore.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <FeatureCarousel features={carouselFeatures} />
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Audio Study Mode — AI Voice Input ─── */}
      <section className="py-24 sm:py-32 relative overflow-hidden">
        <div className="container mx-auto px-5 sm:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
            <ScrollReveal>
              <div>
                <p className="text-amber-500 text-[11px] font-semibold uppercase tracking-[0.25em] mb-4 font-display">
                  Audio Study Mode
                </p>
                <h2 className="font-display font-bold leading-tight mb-5" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
                  Study with your{" "}
                  <GradientText>voice</GradientText>
                </h2>
                <p className="text-white/40 text-sm sm:text-base leading-relaxed mb-6">
                  Listen to AI-narrated study material, dictate questions to your AI tutor, and get answers read back to you. Perfect for commutes, workouts, or when your eyes need a break.
                </p>
                <div className="space-y-3">
                  {[
                    { label: "Text-to-speech narration of all your study packs" },
                    { label: "Adjustable speed (0.5× – 2×) and multiple voice options" },
                    { label: "Voice-activated AI tutor Q&A" },
                    { label: "Background playback while multitasking" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500/60 shrink-0" />
                      <span className="text-white/50 text-sm">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div className="flex flex-col items-center">
                <div className="rounded-2xl border border-white/[0.06] bg-[#0c0c16] p-8 w-full max-w-sm mx-auto shadow-lg shadow-amber-500/[0.04]">
                  <div className="text-center mb-2">
                    <p className="text-xs text-white/30 font-mono uppercase tracking-widest">AI Tutor Voice Mode</p>
                    <p className="text-sm text-white/60 mt-1">&ldquo;Explain photosynthesis...&rdquo;</p>
                  </div>
                  <AIVoiceInput demoMode visualizerBars={40} />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ─── Study Journey — Radial Orbital Timeline ─── */}
      <section className="py-24 sm:py-32 bg-[#060610] relative overflow-hidden">
        <div className="container mx-auto px-5 sm:px-8 relative z-10">
          <ScrollReveal>
            <div className="text-center mb-4">
              <p className="text-amber-500 text-[11px] font-semibold uppercase tracking-[0.25em] mb-4 font-display">
                Your Study Journey
              </p>
              <h2 className="font-display font-bold" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
                <SparklesText
                  text="From upload to mastery"
                  className="font-display font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent inline-block"
                  sparklesCount={8}
                  colors={{ first: "#f59e0b", second: "#f97316" }}
                />
              </h2>
              <p className="text-white/40 mt-4 max-w-md mx-auto text-sm sm:text-base">
                Click on any node to explore. Watch how each step connects to the next.
              </p>
            </div>
          </ScrollReveal>

          <RadialOrbitalTimeline
            timelineData={[
              {
                id: 1,
                title: "Upload",
                date: "Step 1",
                content: "Drop your PDFs, slides, lecture notes, or textbooks. We handle all formats.",
                category: "Input",
                icon: Upload,
                relatedIds: [2],
                status: "completed" as const,
                energy: 100,
              },
              {
                id: 2,
                title: "AI Generate",
                date: "Step 2",
                content: "Claude AI creates summaries, flashcards, quizzes, mind maps, and cloze questions instantly.",
                category: "Processing",
                icon: Zap,
                relatedIds: [1, 3],
                status: "completed" as const,
                energy: 90,
              },
              {
                id: 3,
                title: "Study & Practice",
                date: "Step 3",
                content: "Use spaced repetition, take adaptive quizzes, chat with AI tutor, and practice essays.",
                category: "Learning",
                icon: Brain,
                relatedIds: [2, 4],
                status: "in-progress" as const,
                energy: 70,
              },
              {
                id: 4,
                title: "Track Progress",
                date: "Step 4",
                content: "Analytics dashboard, weekly AI reports, goal tracking, and weak area detection.",
                category: "Analytics",
                icon: BarChart3,
                relatedIds: [3, 5],
                status: "in-progress" as const,
                energy: 50,
              },
              {
                id: 5,
                title: "Ace Your Exam",
                date: "Step 5",
                content: "Proctored exam simulator with fullscreen lockdown. You're ready to score big.",
                category: "Mastery",
                icon: Trophy,
                relatedIds: [4],
                status: "pending" as const,
                energy: 30,
              },
            ]}
          />
        </div>
      </section>

      {/* ─── Live Activity — Animated List ─── */}
      <section className="py-24 sm:py-32 relative overflow-hidden">
        <div className="container mx-auto px-5 sm:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
            <ScrollReveal>
              <div>
                <p className="text-amber-500 text-[11px] font-semibold uppercase tracking-[0.25em] mb-4 font-display">
                  Live on StudySphere
                </p>
                <TextGenerateEffect
                  words="See what students are achieving right now"
                  className="mb-6"
                  duration={0.4}
                />
                <p className="text-white/40 text-sm sm:text-base leading-relaxed mb-8">
                  Every second, students are completing quizzes, generating study packs, hitting goals, and leveling up. Join thousands already studying smarter.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {["A", "M", "D", "C", "S"].map((letter) => (
                      <div key={letter} className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/20 border-2 border-[#08080F] flex items-center justify-center text-[10px] font-bold text-amber-400 font-display">
                        {letter}
                      </div>
                    ))}
                  </div>
                  <span className="text-white/30 text-xs">+2,847 active now</span>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div className="relative h-[380px] overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#08080F] to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#08080F] to-transparent z-10 pointer-events-none" />
                <AnimatedList delay={2500} maxItems={5} className="w-full max-w-md mx-auto">
                  {liveNotifications.map((notif, idx) => (
                    <NotificationItem
                      key={idx}
                      icon={notif.icon}
                      name={notif.name}
                      description={notif.description}
                      time={notif.time}
                      color={notif.color}
                    />
                  ))}
                </AnimatedList>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ─── Use Cases — Glowing Stars Cards ─── */}
      <section className="py-24 sm:py-32 bg-[#060610] relative">
        <div className="container mx-auto px-5 sm:px-8">
          <ScrollReveal>
            <div className="text-center mb-14 sm:mb-16">
              <p className="text-amber-500 text-[11px] font-semibold uppercase tracking-[0.25em] mb-4 font-display">
                Use Cases
              </p>
              <h2 className="font-display font-bold" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
                Built for every study scenario
              </h2>
              <p className="text-white/40 mt-4 max-w-lg mx-auto text-sm sm:text-base">
                Whether you have weeks to prepare or hours until the exam, StudySphere has you covered.
              </p>
            </div>
          </ScrollReveal>

          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {useCases.map((useCase) => (
              <motion.div key={useCase.title} variants={staggerItem} className="h-full">
                <CardSpotlight className="h-full flex flex-col gap-4 min-h-[180px]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 group-hover:bg-amber-500/15 transition-colors">
                      <useCase.icon className="w-5 h-5 text-amber-500" />
                    </div>
                    <h3 className="font-display font-semibold text-white text-base">{useCase.title}</h3>
                  </div>
                  <p className="text-white/40 text-sm leading-relaxed flex-1">{useCase.desc}</p>
                  <div className="flex items-center gap-1.5 text-amber-400/60 text-xs font-medium group-hover:text-amber-400 transition-colors">
                    <span>Learn more</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </CardSpotlight>
              </motion.div>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* ─── AI Tutor Showcase ─── */}
      <section className="py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/[0.02] to-transparent pointer-events-none" />
        <div className="container mx-auto px-5 sm:px-8 relative z-10">
          <ScrollReveal>
            <div className="text-center mb-14 sm:mb-16">
              <p className="text-amber-500 text-[11px] font-semibold uppercase tracking-[0.25em] mb-4 font-display">
                Meet Your AI Tutor
              </p>
              <h2 className="font-display font-bold" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
                Ask anything,{" "}
                <GradientText>get instant answers</GradientText>
              </h2>
              <p className="text-white/40 mt-4 max-w-lg mx-auto text-sm sm:text-base">
                An AI that has read every word of your material. Type a question or choose a prompt.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
            <ScrollReveal>
              <div className="flex justify-center">
                <AIChatCard />
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div className="space-y-8">
                <div>
                  <h3 className="font-display text-2xl font-bold text-white mb-3">Try it yourself</h3>
                  <p className="text-white/40 text-sm leading-relaxed mb-6">
                    Type any study question and watch the magic. Your AI tutor understands context from your uploaded materials and gives grounded, cited answers.
                  </p>
                </div>

                <PlaceholdersAndVanishInput
                  placeholders={[
                    "Explain photosynthesis in simple terms...",
                    "Generate flashcards for chapter 5...",
                    "What are the key themes in Hamlet?",
                    "Quiz me on organic chemistry reactions...",
                    "Summarize the causes of World War I...",
                    "Create a study plan for my midterm...",
                  ]}
                  onChange={() => {}}
                  onSubmit={() => {}}
                />

                <div className="flex items-center gap-4 pt-2">
                  <MessageLoadingBubble />
                  <span className="text-white/30 text-xs">AI is thinking...</span>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-white/50 text-sm leading-relaxed">
                    <span className="text-amber-400 font-medium">AI Tutor:</span>{" "}
                    &ldquo;Photosynthesis is the process by which plants convert sunlight, water, and CO₂ into glucose and oxygen. Think of it as a solar-powered food factory...&rdquo;
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ─── AI Study Plan Preview ─── */}
      <section className="py-24 sm:py-32 bg-[#060610] relative overflow-hidden">
        <div className="container mx-auto px-5 sm:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
            <ScrollReveal>
              <div>
                <p className="text-amber-500 text-[11px] font-semibold uppercase tracking-[0.25em] mb-4 font-display">
                  AI Study Planner
                </p>
                <h2 className="font-display font-bold leading-tight mb-5" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
                  Your personalized{" "}
                  <GradientText>study roadmap</GradientText>
                </h2>
                <p className="text-white/40 text-sm sm:text-base leading-relaxed mb-6">
                  Tell StudySphere your exam date and it generates a day-by-day study plan, broken into focused tasks and subtasks. Every step tracked, every milestone celebrated.
                </p>
                <div className="space-y-3 mb-8">
                  {[
                    { label: "AI generates a personalized plan from your material" },
                    { label: "Tasks broken into bite-sized daily subtasks" },
                    { label: "Progress tracked in real-time as you study" },
                    { label: "Auto-adjusts when you fall behind or race ahead" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500/60 shrink-0" />
                      <span className="text-white/50 text-sm">{item.label}</span>
                    </div>
                  ))}
                </div>
                <Link href="/register">
                  <ShimmerButton className="shadow-lg shadow-amber-500/15">
                    Generate My Study Plan <ArrowRight className="w-4 h-4" />
                  </ShimmerButton>
                </Link>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div className="flex justify-center">
                <AIStudyPlan />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ─── How StudySphere Works — Bounce Cards ─── */}
      <section className="py-24 sm:py-32 relative">
        <div className="container mx-auto px-5 sm:px-8 relative z-10">
          <ScrollReveal>
            <div className="text-center mb-14 sm:mb-16">
              <p className="text-amber-500 text-[11px] font-semibold uppercase tracking-[0.25em] mb-4 font-display">
                The StudySphere Way
              </p>
              <h2 className="font-display font-bold" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
                Four steps to{" "}
                <GradientText>academic success</GradientText>
              </h2>
              <p className="text-white/40 mt-4 max-w-lg mx-auto text-sm sm:text-base">
                Hover over each card to discover how StudySphere transforms your study workflow.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <BounceCardsGrid cards={bounceCards} className="max-w-5xl mx-auto" />
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Testimonials — Evervault Cards ─── */}
      <section className="py-24 sm:py-32 relative">
        <div className="container mx-auto px-5 sm:px-8 relative z-10">
          <ScrollReveal>
            <div className="text-center mb-14 sm:mb-16">
              <p className="text-amber-500 text-[11px] font-semibold uppercase tracking-[0.25em] mb-4 font-display">
                Testimonials
              </p>
              <h2 className="font-display font-bold" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
                <SparklesText
                  text="Loved by students worldwide"
                  className="font-display font-bold text-white inline-block"
                  sparklesCount={6}
                  colors={{ first: "#f59e0b", second: "#f97316" }}
                />
              </h2>
            </div>
          </ScrollReveal>

          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 max-w-6xl mx-auto">
            {testimonials.map((t) => (
              <motion.div key={t.name} variants={staggerItem}>
                <div className="border border-white/[0.08] flex flex-col items-start p-4 relative h-[22rem] rounded-xl overflow-hidden group">
                  <EvervaultIcon className="absolute h-5 w-5 -top-2.5 -left-2.5 text-white/20" />
                  <EvervaultIcon className="absolute h-5 w-5 -bottom-2.5 -left-2.5 text-white/20" />
                  <EvervaultIcon className="absolute h-5 w-5 -top-2.5 -right-2.5 text-white/20" />
                  <EvervaultIcon className="absolute h-5 w-5 -bottom-2.5 -right-2.5 text-white/20" />

                  <EvervaultCard text={t.name[0]} className="!aspect-auto h-32" />

                  <div className="mt-auto w-full">
                    <div className="flex gap-0.5 mb-3">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-white/50 text-sm leading-relaxed mb-4">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500/25 to-orange-500/15 flex items-center justify-center text-xs font-bold text-amber-400 font-display">
                        {t.name[0]}
                      </div>
                      <div>
                        <div className="font-display font-semibold text-white text-xs">{t.name}</div>
                        <div className="text-white/35 text-[10px]">{t.role}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* ─── Trust Bar ─── */}
      <section className="border-y border-white/[0.04] bg-[#060610]">
        <div className="container mx-auto px-5 sm:px-8 py-6">
          <ScrollReveal>
            <div className="flex flex-wrap items-center justify-center gap-7 sm:gap-12 text-white/30 text-xs sm:text-sm">
              {trustItems.map((item) => (
                <motion.div
                  key={item.label}
                  whileHover={{ color: "rgba(251,191,36,0.8)" }}
                  className="flex items-center gap-2 transition-colors cursor-default"
                >
                  <item.icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </motion.div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Final CTA — Lamp Effect ─── */}
      <section className="relative overflow-hidden bg-[#08080F]">
        <LampContainer>
          <motion.div
            initial={{ opacity: 0.5, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.3,
              duration: 0.8,
              ease: "easeInOut",
            }}
            className="text-center"
          >
            <TextGenerateEffect
              words="Your next exam deserves a secret weapon."
              className="bg-gradient-to-br from-amber-200 to-amber-500 bg-clip-text"
              duration={0.6}
            />
            <p className="text-white/40 mt-5 sm:mt-6 max-w-md mx-auto text-sm sm:text-base">
              Join thousands of students who stopped stressing and started acing.
              Free to start, no credit card needed.
            </p>
            <div className="mt-9 sm:mt-10">
              <MagneticElement strength={0.2}>
                <Link href="/register">
                  <ShimmerButton className="shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 text-base px-9 py-4">
                    Get Started Free
                    <ArrowRight className="w-5 h-5" />
                  </ShimmerButton>
                </Link>
              </MagneticElement>
            </div>
          </motion.div>
        </LampContainer>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/[0.05] py-8 sm:py-10 bg-[#05050C]">
        <div className="container mx-auto px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="font-display text-sm font-bold">
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Study</span>
                <span className="text-white">Sphere</span>
              </span>
            </div>
            <p className="text-white/20 text-xs sm:text-sm">
              &copy; {new Date().getFullYear()} StudySphere. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
