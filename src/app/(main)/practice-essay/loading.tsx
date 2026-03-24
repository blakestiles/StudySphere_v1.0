export default function Loading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
      <div className="h-8 w-36 rounded-lg bg-muted/50" />
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="h-5 w-48 rounded bg-muted/40" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-4 w-full rounded bg-muted/30" />
          ))}
        </div>
      </div>
      <div className="h-48 rounded-xl border border-border bg-card" />
    </div>
  );
}
