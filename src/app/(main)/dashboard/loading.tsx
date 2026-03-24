export default function Loading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
      <div className="space-y-1">
        <div className="h-8 w-56 rounded-lg bg-muted/50" />
        <div className="h-4 w-40 rounded-md bg-muted/30" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="h-4 w-20 rounded bg-muted/40" />
            <div className="h-8 w-12 rounded bg-muted/50" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="h-5 w-36 rounded bg-muted/40" />
          <div className="h-32 w-full rounded-lg bg-muted/30" />
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="h-5 w-28 rounded bg-muted/40" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 w-full rounded-lg bg-muted/30" />
          ))}
        </div>
      </div>
    </div>
  );
}
