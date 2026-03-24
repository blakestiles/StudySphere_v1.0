export default function Loading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
      <div className="space-y-1">
        <div className="h-8 w-1/2 rounded-lg bg-muted/50" />
        <div className="h-4 w-1/3 rounded-md bg-muted/30" />
      </div>
      <div className="flex gap-1">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-9 w-24 rounded-lg bg-muted/30" />
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="h-5 w-40 rounded bg-muted/40" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 w-full rounded bg-muted/30" />
          ))}
          <div className="h-4 w-2/3 rounded bg-muted/25" />
        </div>
      </div>
    </div>
  );
}
