export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import lazyLoad from "next/dynamic";
const ChatPage = lazyLoad(
  () => import("@/components/features/chat/ChatPage"),
  { loading: () => <div className="animate-pulse h-[600px] rounded-xl bg-muted/40" /> }
);

export default async function ChatRoute() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return <ChatPage />;
}
