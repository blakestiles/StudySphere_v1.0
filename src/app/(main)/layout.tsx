import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import NavigationProgress from "@/components/layout/NavigationProgress";
import dynamic from "next/dynamic";
import { requireSession } from "@/lib/auth-cache";
import { getCachedReadyPacks } from "@/lib/data-cache";
import { StudyDataProvider } from "@/contexts/StudyDataContext";

const CommandPalette = dynamic(
  () => import("@/components/features/command-palette/CommandPalette")
);

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const readyPacks = await getCachedReadyPacks(session.user.id);

  return (
    <StudyDataProvider readyPacks={readyPacks}>
      <div className="min-h-screen bg-background bg-grid-pattern relative">
        {/* Ambient background glows */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] bg-amber-500/[0.02] rounded-full blur-[150px]" />
          <div className="absolute -bottom-[200px] -left-[200px] w-[500px] h-[500px] bg-amber-500/[0.015] rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/[0.01] rounded-full blur-[100px]" />
        </div>

        <NavigationProgress />
        <Navbar />
        <div className="flex relative">
          <Sidebar />
          <main className="flex-1 p-4 sm:p-6 md:ml-60 min-h-[calc(100vh-3.5rem)]">
            {children}
          </main>
        </div>
        <CommandPalette />
      </div>
    </StudyDataProvider>
  );
}
