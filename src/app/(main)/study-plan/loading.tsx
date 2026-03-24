export default function Loading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
      <div className="h-8 w-28 rounded-lg bg-muted/50" />
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="h-5 w-44 rounded bg-muted/40" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="h-5 w-5 rounded bg-muted/40 mt-0.5 shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-3/4 rounded bg-muted/40" />
                <div className="h-3 w-1/2 rounded bg-muted/25" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
