import Link from "next/link";
import { GraduationCap } from "lucide-react";
import dynamic from "next/dynamic";

const WebGLWave = dynamic(() => import("@/components/ui/webgl-wave"));

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* WebGL Chromatic Wave Background */}
      <WebGLWave className="opacity-50" />

      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70 pointer-events-none z-[1]" />

      {/* Subtle ambient glows on top */}
      <div className="absolute inset-0 pointer-events-none z-[2] overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-amber-500/[0.04] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-amber-500/[0.03] rounded-full blur-[120px]" />
      </div>

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-8 relative z-10 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:shadow-amber-500/40 transition-shadow duration-300">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <span className="font-display text-2xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Study</span>
          <span className="text-white">Sphere</span>
        </span>
      </Link>

      <div className="w-full max-w-md space-y-8 relative z-10">{children}</div>

      {/* Bottom decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent z-10" />
    </div>
  );
}
