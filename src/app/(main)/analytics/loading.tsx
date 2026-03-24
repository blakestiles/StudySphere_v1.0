export default function Loading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
      <div className="h-8 w-32 rounded-lg bg-muted/50" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-2">
            <div className="h-4 w-20 rounded bg-muted/40" />
            <div className="h-8 w-14 rounded bg-muted/50" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="h-5 w-40 rounded bg-muted/40" />
            <div className="h-40 w-full rounded-lg bg-muted/30" />
          </div>
        ))}
      </div>
    </div>
  );
}
