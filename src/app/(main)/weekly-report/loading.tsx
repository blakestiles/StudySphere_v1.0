export default function Loading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
      <div className="h-8 w-36 rounded-lg bg-muted/50" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-2">
            <div className="h-4 w-20 rounded bg-muted/40" />
            <div className="h-8 w-12 rounded bg-muted/50" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="h-5 w-40 rounded bg-muted/40" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 w-full rounded bg-muted/30" />
          ))}
        </div>
      </div>
    </div>
  );
}
