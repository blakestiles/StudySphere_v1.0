export default function Loading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
      <div className="h-8 w-24 rounded-lg bg-muted/50" />
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
            <div className="h-9 w-9 rounded-lg bg-muted/40 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-1/2 rounded bg-muted/50" />
              <div className="h-3 w-1/3 rounded bg-muted/30" />
            </div>
            <div className="h-6 w-16 rounded-full bg-muted/30 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
