export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-lg bg-muted/50" />
        <div className="h-4 w-72 rounded-md bg-muted/30" />
      </div>
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="h-5 w-40 rounded-md bg-muted/40" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-muted/30" />
          <div className="h-4 w-5/6 rounded bg-muted/30" />
          <div className="h-4 w-3/4 rounded bg-muted/30" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="h-4 w-32 rounded bg-muted/40" />
          <div className="h-3 w-full rounded bg-muted/30" />
          <div className="h-3 w-2/3 rounded bg-muted/30" />
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="h-4 w-32 rounded bg-muted/40" />
          <div className="h-3 w-full rounded bg-muted/30" />
          <div className="h-3 w-2/3 rounded bg-muted/30" />
        </div>
      </div>
    </div>
  );
}
