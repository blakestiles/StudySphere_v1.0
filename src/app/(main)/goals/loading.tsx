export default function Loading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-20 rounded-lg bg-muted/50" />
        <div className="h-9 w-28 rounded-xl bg-muted/40" />
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-1/2 rounded bg-muted/50" />
              <div className="h-6 w-16 rounded-full bg-muted/30" />
            </div>
            <div className="h-2 w-full rounded-full bg-muted/30" />
            <div className="h-3 w-1/4 rounded bg-muted/25" />
          </div>
        ))}
      </div>
    </div>
  );
}
