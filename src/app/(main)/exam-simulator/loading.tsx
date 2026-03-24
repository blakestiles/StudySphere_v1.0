export default function Loading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
      <div className="h-8 w-40 rounded-lg bg-muted/50" />
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="h-5 w-48 rounded bg-muted/40" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 w-full rounded-lg bg-muted/30" />
          ))}
        </div>
        <div className="h-10 w-32 rounded-xl bg-muted/40" />
      </div>
    </div>
  );
}
