import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import dynamic from "next/dynamic";
const CommandPalette = dynamic(
  () => import("@/components/features/command-palette/CommandPalette")
);

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background bg-grid-pattern relative">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] bg-orange-500/[0.02] rounded-full blur-[150px]" />
        <div className="absolute -bottom-[200px] -left-[200px] w-[500px] h-[500px] bg-amber-500/[0.015] rounded-full blur-[120px]" />
      </div>

      <Navbar />
      <div className="flex relative">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 md:ml-64 min-h-[calc(100vh-3.5rem)]">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
