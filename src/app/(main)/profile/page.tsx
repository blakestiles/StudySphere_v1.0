import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth-cache";
import { getCachedProfileData } from "@/lib/data-cache";
import ProfilePage from "@/components/features/profile/ProfilePage";
import TextShimmer from "@/components/ui/text-shimmer";

export default async function ProfileServerPage() {
  const session = await requireSession();
  const data = await getCachedProfileData(session.user.id);

  if (!data.user) redirect("/login");

  return (
    <div className="space-y-5">
      <div>
        <TextShimmer className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Profile</TextShimmer>
        <p className="text-sm text-muted-foreground mt-1">Your account, stats, and achievements</p>
      </div>
      <ProfilePage
        user={data.user}
        stats={data.stats}
      />
    </div>
  );
}
