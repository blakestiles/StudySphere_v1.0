export default function Loading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
      <div className="h-8 w-32 rounded-lg bg-muted/50" />
      <div className="rounded-xl border border-border bg-card p-8 flex flex-col items-center gap-6">
        <div className="h-40 w-40 rounded-full bg-muted/30" />
        <div className="h-6 w-48 rounded bg-muted/40" />
        <div className="flex gap-3">
          <div className="h-10 w-24 rounded-xl bg-muted/40" />
          <div className="h-10 w-24 rounded-xl bg-muted/30" />
        </div>
      </div>
    </div>
  );
}
