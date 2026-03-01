export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ChatPage from "@/components/features/chat/ChatPage";

export default async function ChatRoute() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return <ChatPage />;
}
