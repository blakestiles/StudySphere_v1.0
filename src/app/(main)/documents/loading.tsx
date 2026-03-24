export default function Loading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-36 rounded-lg bg-muted/50" />
        <div className="h-9 w-32 rounded-xl bg-muted/40" />
      </div>
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
            <div className="h-10 w-10 rounded-lg bg-muted/40 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 rounded bg-muted/50" />
              <div className="h-3 w-1/4 rounded bg-muted/30" />
            </div>
            <div className="h-7 w-24 rounded-lg bg-muted/30 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
