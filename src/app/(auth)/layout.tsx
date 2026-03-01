import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Large gradient blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-orange-500/[0.06] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-500/[0.04] rounded-full blur-[120px]" />
        <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-orange-400/[0.03] rounded-full blur-[100px]" />

        {/* Animated floating orbs */}
        <div className="absolute top-[15%] left-[10%] w-2 h-2 rounded-full bg-orange-400/20 animate-float" />
        <div className="absolute top-[70%] right-[15%] w-1.5 h-1.5 rounded-full bg-amber-400/25 animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-[40%] right-[10%] w-1 h-1 rounded-full bg-orange-300/20 animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-[20%] left-[20%] w-2.5 h-2.5 rounded-full bg-amber-300/15 animate-float" style={{ animationDelay: "1.5s" }} />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-50" />
      </div>

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-8 relative z-10 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/25 group-hover:shadow-orange-500/40 transition-shadow duration-300">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <span className="text-2xl font-bold">
          <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Study</span>
          <span>Sphere</span>
        </span>
      </Link>

      <div className="w-full max-w-md space-y-8 relative z-10">{children}</div>

      {/* Bottom decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
    </div>
  );
}
