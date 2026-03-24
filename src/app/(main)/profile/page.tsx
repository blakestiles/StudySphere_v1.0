import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth-cache";
import { getCachedProfileData } from "@/lib/data-cache";
import ProfilePage from "@/components/features/profile/ProfilePage";

export default async function ProfileServerPage() {
  const session = await requireSession();
  const data = await getCachedProfileData(session.user.id);

  if (!data.user) redirect("/login");

  return (
    <ProfilePage
      user={data.user}
      stats={data.stats}
    />
  );
}
