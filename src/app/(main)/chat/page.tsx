import lazyLoad from "next/dynamic";
import BlurFade from "@/components/ui/blur-fade";
import TextShimmer from "@/components/ui/text-shimmer";

const ChatPage = lazyLoad(
  () => import("@/components/features/chat/ChatPage"),
  { loading: () => <div className="animate-pulse h-[600px] rounded-xl bg-muted/40" /> }
);

export default async function ChatRoute() {
  return (
    <BlurFade delay={0.1} duration={0.4}>
      <div className="space-y-4">
        <div>
          <TextShimmer className="font-display text-2xl sm:text-3xl font-bold tracking-tight">AI Tutor</TextShimmer>
          <p className="text-sm text-muted-foreground mt-1">Ask questions about your study materials</p>
        </div>
        <ChatPage />
      </div>
    </BlurFade>
  );
}
