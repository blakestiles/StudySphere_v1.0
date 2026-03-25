"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Mail } from "lucide-react";
import ShineBorder from "@/components/ui/shine-border";

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
          <div className="p-8 text-center space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="flex justify-center"
            >
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Mail className="w-8 h-8 text-amber-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="space-y-2"
            >
              <h1 className="font-display text-2xl font-bold tracking-tight">
                Verify your email
              </h1>
              <p className="text-muted-foreground text-sm">
                We&apos;ve sent a verification link to your email address. Please check your inbox and click the link to activate your account.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="text-xs text-muted-foreground"
            >
              Didn&apos;t receive an email? Check your spam folder or{" "}
              <span className="text-amber-600 dark:text-amber-400">
                contact support
              </span>
              .
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.5 }}
            >
              <Link
                href="/login"
                className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-500 transition-colors underline-offset-4 hover:underline"
              >
                Back to login
              </Link>
            </motion.div>
          </div>
        </div>
      </ShineBorder>
    </motion.div>
  );
}
