"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { Mail, CheckCircle, XCircle } from "lucide-react";
import ShineBorder from "@/components/ui/shine-border";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"pending" | "success" | "error" | "idle">(
    token ? "pending" : "idle"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;

    fetch(`/api/auth/verify-email?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setStatus("error");
          setMessage(data.error);
        } else {
          setStatus("success");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      });
  }, [token]);

  return (
    <div className="p-8 text-center space-y-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="flex justify-center"
      >
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
          status === "success"
            ? "bg-green-500/10"
            : status === "error"
            ? "bg-red-500/10"
            : "bg-amber-500/10"
        }`}>
          {status === "success" ? (
            <CheckCircle className="w-8 h-8 text-green-500" />
          ) : status === "error" ? (
            <XCircle className="w-8 h-8 text-red-500" />
          ) : (
            <Mail className="w-8 h-8 text-amber-500" />
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="space-y-2"
      >
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {status === "success"
            ? "Email verified!"
            : status === "error"
            ? "Verification failed"
            : status === "pending"
            ? "Verifying..."
            : "Verify your email"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {status === "success"
            ? "Your account is now active. You can sign in."
            : status === "error"
            ? message || "This link is invalid or has expired."
            : status === "pending"
            ? "Please wait while we verify your email address."
            : "We've sent a verification link to your email address. Please check your inbox and click the link to activate your account."}
        </p>
      </motion.div>

      {status === "idle" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="text-xs text-muted-foreground"
        >
          Didn&apos;t receive an email? Check your spam folder or{" "}
          <span className="text-amber-600 dark:text-amber-400">contact support</span>.
        </motion.div>
      )}

      {(status === "success" || status === "error" || status === "idle") && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.5 }}
        >
          <Link
            href="/login"
            className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-500 transition-colors underline-offset-4 hover:underline"
          >
            {status === "success" ? "Sign in now" : "Back to login"}
          </Link>
        </motion.div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
    >
      <ShineBorder
        borderRadius={20}
        borderWidth={1}
        duration={8}
        color={["#fbbf24", "#f59e0b", "#d97706"]}
        className="shadow-2xl shadow-black/5 dark:shadow-black/30"
      >
        <div className="glass-card rounded-[20px] overflow-hidden">
          <Suspense fallback={<div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>}>
            <VerifyEmailContent />
          </Suspense>
        </div>
      </ShineBorder>
    </motion.div>
  );
}
