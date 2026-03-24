export default function Loading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-24 rounded-lg bg-muted/50" />
        <div className="h-9 w-28 rounded-xl bg-muted/40" />
      </div>
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="h-6 w-32 rounded bg-muted/40" />
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-lg bg-muted/30" />
            <div className="h-8 w-8 rounded-lg bg-muted/30" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-muted/20" />
          ))}
        </div>
      </div>
    </div>
  );
}
