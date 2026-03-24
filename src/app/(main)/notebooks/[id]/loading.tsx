export default function Loading() {
  return (
    <div className="space-y-4 max-w-4xl mx-auto animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-48 rounded-lg bg-muted/50" />
        <div className="h-8 w-20 rounded-lg bg-muted/35" />
      </div>
      <div className="rounded-xl border border-border bg-card p-6 min-h-[500px] space-y-3">
        <div className="h-4 w-full rounded bg-muted/30" />
        <div className="h-4 w-5/6 rounded bg-muted/25" />
        <div className="h-4 w-4/5 rounded bg-muted/20" />
      </div>
    </div>
  );
}
