export default function Loading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-36 rounded-lg bg-muted/50" />
        <div className="h-9 w-28 rounded-xl bg-muted/40" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="h-5 w-3/4 rounded bg-muted/50" />
            <div className="h-4 w-1/2 rounded bg-muted/30" />
            <div className="h-3 w-1/3 rounded bg-muted/25" />
          </div>
        ))}
      </div>
    </div>
  );
}
