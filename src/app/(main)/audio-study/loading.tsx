export default function Loading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
      <div className="h-8 w-32 rounded-lg bg-muted/50" />
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="h-5 w-40 rounded bg-muted/40" />
        <div className="h-2 w-full rounded-full bg-muted/30" />
        <div className="flex items-center justify-center gap-4">
          <div className="h-10 w-10 rounded-full bg-muted/30" />
          <div className="h-12 w-12 rounded-full bg-muted/40" />
          <div className="h-10 w-10 rounded-full bg-muted/30" />
        </div>
      </div>
    </div>
  );
}
