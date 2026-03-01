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
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { useState, useRef, useEffect } from "react";

import StarsBackground from "@/components/animations/StarsBackground";
import FloatingParticles from "@/components/animations/FloatingParticles";
import RippleButton from "@/components/animations/RippleButton";
import SpotlightCard from "@/components/animations/SpotlightCard";
import AnimatedCounter from "@/components/animations/AnimatedCounter";
import TextReveal from "@/components/animations/TextReveal";
import ScrollReveal from "@/components/animations/ScrollReveal";
import MagneticElement from "@/components/animations/MagneticElement";
import GradientText from "@/components/animations/GradientText";
import FluidTabs from "@/components/animations/FluidTabs";
import StaggerGrid, { staggerItem } from "@/components/animations/StaggerGrid";

/* ─── Feature data ─── */
const coreFeatures: { icon: LucideIcon; title: string; desc: string; color: string; bg: string }[] = [
  { icon: FileText, title: "Smart Summaries", desc: "AI generates concise and detailed summaries with hierarchical topic outlines from anything you upload.", color: "text-orange-500", bg: "bg-orange-500/10" },
  { icon: Network, title: "Mind Maps", desc: "Visualize how concepts connect with auto-generated interactive knowledge maps.", color: "text-blue-400", bg: "bg-blue-400/10" },
  { icon: Layers, title: "Spaced Repetition Flashcards", desc: "SM-2 algorithm flashcards that adapt to your pace. Rate difficulty and the system schedules optimal reviews.", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { icon: Brain, title: "Adaptive Quizzes", desc: "MCQ quizzes that identify your weak areas and generate targeted questions to close knowledge gaps.", color: "text-violet-400", bg: "bg-violet-400/10" },
  { icon: MessageSquare, title: "AI Tutor", desc: "Chat with an AI that has read every word of your material. Ask anything and get cited, grounded answers.", color: "text-amber-400", bg: "bg-amber-400/10" },
  { icon: PenTool, title: "Practice Essays", desc: "Write essay answers and get AI grading on Accuracy, Depth, Clarity, and Critical Thinking with actionable feedback.", color: "text-rose-400", bg: "bg-rose-400/10" },
];

const powerTools: { icon: LucideIcon; title: string; desc: string; color: string }[] = [
  { icon: Timer, title: "Focus Mode", desc: "Pomodoro timer with animated arcs, AI micro-goals, phase tracking, and session recaps to keep you locked in.", color: "text-orange-500" },
  { icon: CalendarDays, title: "AI Study Planner", desc: "Set your exam date and let AI generate a day-by-day study schedule with calendar events auto-created for you.", color: "text-blue-400" },
  { icon: Map, title: "Knowledge Graph", desc: "Force-directed visualization mapping topics across your entire library with glowing nodes and animated connections.", color: "text-emerald-400" },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Track study streaks, quiz scores, flashcard accuracy, weak areas, and study time with beautiful charts.", color: "text-violet-400" },
  { icon: CalendarDays, title: "Study Calendar", desc: "Plan and track study sessions with a visual calendar. Never miss a review or study goal.", color: "text-amber-400" },
  { icon: BookOpen, title: "Document Viewer", desc: "Read your uploaded materials with highlighting, annotations, and AI-powered note-taking built right in.", color: "text-rose-400" },
];

const useCases: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: GraduationCap, title: "Exam Prep", desc: "Upload your syllabus and notes, generate a study plan, and let AI quiz you until you're exam-ready." },
  { icon: BookOpen, title: "Lecture Review", desc: "Turn lecture slides into flashcards and summaries. Review in minutes what took hours to sit through." },
  { icon: FileText, title: "Research Papers", desc: "Extract key arguments, build concept maps, and practice explaining the material with AI." },
  { icon: Clock, title: "Last-Minute Cramming", desc: "Focus mode + adaptive quizzes + AI-prioritized weak areas. Maximum results, minimum time." },
];

const testimonials = [
  { quote: "Mind maps make complex topics so much clearer. Love this tool!", name: "Alex R.", role: "Engineering", rating: 5 },
  { quote: "Focus mode keeps me on track. No more 3-hour distracted study sessions.", name: "Chen W.", role: "Business", rating: 5 },
  { quote: "Best study app I've ever used. The AI actually understands my material.", name: "Maria G.", role: "Law Student", rating: 5 },
  { quote: "The AI tutor increased my scores by 20%. It's incredible.", name: "David K.", role: "Pre-Med", rating: 5 },
];

const trustItems: { icon: LucideIcon; label: string }[] = [
  { icon: Shield, label: "Your data stays private" },
  { icon: Sparkles, label: "Instant AI generation" },
  { icon: Cpu, label: "Powered by advanced AI" },
  { icon: LineChart, label: "Detailed analytics" },
  { icon: Globe, label: "Study anytime, anywhere" },
];

/* ─── Feature Tabs ─── */
const featureTabs = [
  { label: "All Features", value: "all" },
  { label: "AI-Powered", value: "ai" },
  { label: "Study Tools", value: "tools" },
];

export default function LandingPage() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);
  const [activeFeatureTab, setActiveFeatureTab] = useState("all");
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredFeatures = coreFeatures.filter((f) => {
    if (activeFeatureTab === "all") return true;
    if (activeFeatureTab === "ai") return ["AI Tutor", "Smart Summaries", "Adaptive Quizzes", "Practice Essays"].includes(f.title);
    return ["Mind Maps", "Spaced Repetition Flashcards"].includes(f.title);
  });

  return (
    <div className="min-h-screen bg-[#060A13] text-white overflow-x-hidden">
      {/* ─── Navbar ─── */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
        className={`sticky top-0 z-50 transition-all duration-300 ${
          navScrolled
            ? "bg-[#060A13]/90 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ rotate: 15 }}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20"
            >
              <GraduationCap className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-xl font-bold">
              <span className="text-orange-500">Study</span>
              <span className="text-white">Sphere</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex text-sm text-gray-400 hover:text-white transition-colors px-4 py-2"
            >
              Sign In
            </Link>
            <MagneticElement strength={0.15}>
              <Link
                href="/register"
                className="px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-full transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40"
              >
                Get Started
              </Link>
            </MagneticElement>
          </div>
        </div>
      </motion.header>

      {/* ─── Hero Section ─── */}
      <section ref={heroRef} className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <StarsBackground count={100} />
        <FloatingParticles count={25} />

        {/* Hero glow orbs — subtle, no orange */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-violet-500/[0.03] rounded-full blur-[100px]" />
          <div className="absolute top-1/4 right-1/4 w-[200px] h-[200px] bg-blue-500/[0.03] rounded-full blur-[80px]" />
        </div>

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="container mx-auto px-4 sm:px-6 text-center relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tight leading-[1.1]">
              Study less.{" "}
              <GradientText from="from-orange-400" via="via-amber-300" to="to-orange-600">
                Score
              </GradientText>
              <br />
              <GradientText from="from-orange-400" via="via-amber-300" to="to-orange-600">
                MORE.
              </GradientText>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
            className="mt-6 sm:mt-8 text-gray-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
          >
            Your notes, slides, or textbooks go in. Flashcards, quizzes,
            summaries, mind maps, and a personal AI tutor that knows every page
            come out.
            <br />
            <span className="text-gray-500 italic">
              Like magic, but it&apos;s real.
            </span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/register">
              <RippleButton variant="primary" size="lg">
                Start Learning Free
                <ArrowRight className="w-5 h-5" />
              </RippleButton>
            </Link>
            <Link href="/login">
              <RippleButton variant="secondary" size="lg">
                Sign In
              </RippleButton>
            </Link>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-16 sm:mt-20"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="w-6 h-6 text-gray-600 mx-auto" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="relative border-y border-white/[0.04] bg-[#080C16]">
        <div className="absolute inset-0 animate-shimmer" />
        <div className="container mx-auto px-4 sm:px-6 py-8 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            {[
              { value: "4.9", suffix: "★", label: "Average Rating" },
              { value: "50K+", suffix: "", label: "Study Packs Created" },
              { value: "1000K+", suffix: "", label: "Flashcards Generated" },
              { value: "98%", suffix: "", label: "Student Satisfaction" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl sm:text-3xl font-bold text-orange-500">
                  <AnimatedCounter value={stat.value} />
                  {stat.suffix}
                </div>
                <div className="text-xs text-gray-500 mt-1.5 tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Core Features ─── */}
      <section className="py-20 sm:py-28 md:py-32 relative">
        {/* removed orange glow orb */}
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <ScrollReveal>
            <div className="text-center mb-10 sm:mb-14">
              <p className="text-orange-500 text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] mb-3">
                Core Features
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
                Everything you need to{" "}
                <span className="relative">
                  <GradientText>ace your exams</GradientText>
                </span>
              </h2>
              <p className="text-gray-400 mt-4 max-w-xl mx-auto text-sm sm:text-base">
                Upload once. StudySphere builds your entire study toolkit in seconds.
              </p>
            </div>
          </ScrollReveal>

          {/* Feature tabs */}
          <ScrollReveal className="flex justify-center mb-10">
            <FluidTabs
              tabs={featureTabs}
              activeTab={activeFeatureTab}
              onTabChange={setActiveFeatureTab}
            />
          </ScrollReveal>

          <AnimatePresence mode="wait">
            <StaggerGrid
              key={activeFeatureTab}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto"
            >
              {filteredFeatures.map((feature) => (
                <motion.div key={feature.title} variants={staggerItem}>
                  <SpotlightCard className="h-full">
                    <div className="p-6">
                      <div className={`w-11 h-11 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}>
                        <feature.icon className={`w-5 h-5 ${feature.color}`} />
                      </div>
                      <h3 className="font-semibold text-white text-base mb-2">{feature.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                    </div>
                  </SpotlightCard>
                </motion.div>
              ))}
            </StaggerGrid>
          </AnimatePresence>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-20 sm:py-28 md:py-32 bg-[#080C16] relative">
        <div className="container mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <div className="text-center mb-14 sm:mb-16">
              <p className="text-orange-500 text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] mb-3">
                Simple as 1-2-3
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">How it works</h2>
              <p className="text-gray-400 mt-4 text-sm sm:text-base">
                From upload to exam-ready in under 60 seconds
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto">
            {[
              { num: "01", icon: Upload, title: "Upload anything", desc: "PDF, text, lecture notes, textbook chapters, or slides. Just drop it in." },
              { num: "02", icon: Zap, title: "AI does the heavy lifting", desc: "In seconds, get a complete study pack: summaries, flashcards, quizzes, mind maps, and topic outlines." },
              { num: "03", icon: Target, title: "Study smarter, not harder", desc: "Use spaced repetition, take adaptive quizzes, chat with your AI tutor, practice essays, and track your progress." },
            ].map((step, i) => (
              <ScrollReveal key={step.num} delay={i * 0.15}>
                <SpotlightCard className="h-full" spotlightColor="rgba(249, 115, 22, 0.06)">
                  <div className="relative p-8 text-center">
                    <div className="absolute top-4 right-6 text-6xl font-black text-orange-500/[0.08] select-none">
                      {step.num}
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 flex items-center justify-center mx-auto mb-6 border border-orange-500/10"
                    >
                      <step.icon className="w-6 h-6 text-orange-500" />
                    </motion.div>
                    <h3 className="font-bold text-lg text-white mb-3">{step.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </SpotlightCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Power Tools ─── */}
      <section className="py-20 sm:py-28 md:py-32 relative">
        {/* removed glow orb */}
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <ScrollReveal>
            <div className="text-center mb-14 sm:mb-16">
              <p className="text-orange-500 text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] mb-3">
                Power Tools
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                Go beyond basic studying
              </h2>
              <p className="text-gray-400 mt-4 max-w-xl mx-auto text-sm sm:text-base">
                Advanced tools that make StudySphere the most complete study platform ever built.
              </p>
            </div>
          </ScrollReveal>

          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {powerTools.map((tool) => (
              <motion.div key={tool.title} variants={staggerItem} className="flex gap-4 group">
                <div className="shrink-0">
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center group-hover:border-orange-500/20 transition-colors"
                  >
                    <tool.icon className={`w-5 h-5 ${tool.color}`} />
                  </motion.div>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1.5 group-hover:text-orange-400 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{tool.desc}</p>
                </div>
              </motion.div>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* ─── Use Cases ─── */}
      <section className="py-20 sm:py-28 md:py-32 bg-[#080C16] relative">
        <div className="container mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <div className="text-center mb-14 sm:mb-16">
              <p className="text-orange-500 text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] mb-3">
                Use Cases
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                Built for every study scenario
              </h2>
              <p className="text-gray-400 mt-4 max-w-xl mx-auto text-sm sm:text-base">
                Whether you have weeks to prepare or hours until the exam, StudySphere has you covered.
              </p>
            </div>
          </ScrollReveal>

          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 max-w-4xl mx-auto">
            {useCases.map((useCase) => (
              <motion.div key={useCase.title} variants={staggerItem}>
                <SpotlightCard className="h-full">
                  <div className="p-7">
                    <div className="w-11 h-11 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4">
                      <useCase.icon className="w-5 h-5 text-orange-500" />
                    </div>
                    <h3 className="font-bold text-white text-lg mb-2">{useCase.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{useCase.desc}</p>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-20 sm:py-28 md:py-32 relative">
        {/* removed orange glow orb */}
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <ScrollReveal>
            <div className="text-center mb-14 sm:mb-16">
              <p className="text-orange-500 text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] mb-3">
                Testimonials
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                Loved by students worldwide
              </h2>
              <p className="text-gray-400 mt-4 text-sm sm:text-base">
                Don&apos;t take our word for it. Here&apos;s what students are saying.
              </p>
            </div>
          </ScrollReveal>

          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 max-w-6xl mx-auto">
            {testimonials.map((t) => (
              <motion.div key={t.name} variants={staggerItem}>
                <SpotlightCard className="h-full" spotlightColor="rgba(249, 115, 22, 0.05)">
                  <div className="p-6">
                    <div className="flex gap-0.5 mb-3">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-orange-500 text-orange-500" />
                      ))}
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500/30 to-amber-500/20 flex items-center justify-center text-xs font-bold text-orange-400">
                        {t.name[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-white text-sm">{t.name}</div>
                        <div className="text-gray-500 text-xs">{t.role}</div>
                      </div>
                    </div>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* ─── Trust Bar ─── */}
      <section className="border-y border-white/[0.04] bg-[#080C16]">
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <ScrollReveal>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-gray-500 text-xs sm:text-sm">
              {trustItems.map((item) => (
                <motion.div
                  key={item.label}
                  whileHover={{ color: "#f97316" }}
                  className="flex items-center gap-2 transition-colors"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </motion.div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="relative py-24 sm:py-32 md:py-40 overflow-hidden">
        <StarsBackground count={60} />
        {/* removed orange glow orb */}
        <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
          <ScrollReveal>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Your next exam deserves
              <br />
              <GradientText>a secret weapon.</GradientText>
            </h2>
            <p className="text-gray-400 mt-5 sm:mt-6 max-w-lg mx-auto text-sm sm:text-base">
              Join thousands of students who stopped stressing and started acing.
              Free to start, no credit card needed.
            </p>
            <div className="mt-8 sm:mt-10">
              <MagneticElement strength={0.2}>
                <Link href="/register">
                  <RippleButton variant="primary" size="lg">
                    Get Started Free
                    <ArrowRight className="w-5 h-5" />
                  </RippleButton>
                </Link>
              </MagneticElement>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/[0.04] py-8 sm:py-10 bg-[#060A13]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold">
                <span className="text-orange-500">Study</span>Sphere
              </span>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm">
              &copy; {new Date().getFullYear()} StudySphere. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
