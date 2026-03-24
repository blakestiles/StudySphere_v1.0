import { cache } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";

// Deduplicates auth() calls within a single React render pass
export const getSession = cache(auth);

// For use in protected pages — redirects to /login if unauthenticated.
// Returns a non-nullable session so pages don't need null checks.
export const requireSession = cache(async (): Promise<Session & { user: { id: string } }> => {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session as Session & { user: { id: string } };
});
