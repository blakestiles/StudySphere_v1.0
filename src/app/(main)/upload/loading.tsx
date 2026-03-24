export default function Loading() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-pulse">
      <div className="h-8 w-44 rounded-lg bg-muted/50" />
      <div className="rounded-xl border-2 border-dashed border-border bg-card p-12 flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-muted/30" />
        <div className="h-5 w-48 rounded bg-muted/40" />
        <div className="h-4 w-64 rounded bg-muted/25" />
        <div className="h-10 w-32 rounded-xl bg-muted/35" />
      </div>
    </div>
  );
}
