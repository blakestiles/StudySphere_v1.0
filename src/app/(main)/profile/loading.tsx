export default function Loading() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-pulse">
      <div className="h-8 w-20 rounded-lg bg-muted/50" />
      <div className="rounded-xl border border-border bg-card p-6 flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-muted/40 shrink-0" />
        <div className="space-y-2">
          <div className="h-5 w-32 rounded bg-muted/50" />
          <div className="h-4 w-48 rounded bg-muted/30" />
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-20 rounded bg-muted/40" />
            <div className="h-9 w-full rounded-lg bg-muted/30" />
          </div>
        ))}
      </div>
    </div>
  );
}
