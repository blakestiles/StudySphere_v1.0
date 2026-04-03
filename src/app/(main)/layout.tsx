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
      <div className="min-h-screen bg-background relative">
        {/* Subtle grid pattern only */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.4] dark:opacity-[0.15]" />
        </div>

        <NavigationProgress />
        <Navbar />
        <div className="flex relative">
          <Sidebar />
          <main className="flex-1 p-4 sm:p-6 md:ml-60 min-h-[calc(100vh-3.5rem)]">
            <div className="section-page">
              {children}
            </div>
          </main>
        </div>
        <CommandPalette />
      </div>
    </StudyDataProvider>
  );
}
