
import lazyLoad from "next/dynamic";
import BlurFade from "@/components/ui/blur-fade";

const ChatPage = lazyLoad(
  () => import("@/components/features/chat/ChatPage"),
  { loading: () => <div className="animate-pulse h-[600px] rounded-xl bg-muted/40" /> }
);

export default async function ChatRoute() {
  return (
    <BlurFade delay={0.1} duration={0.4}>
      <ChatPage />
    </BlurFade>
  );
}
