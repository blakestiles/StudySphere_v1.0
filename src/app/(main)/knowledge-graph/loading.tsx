export default function Loading() {
  return (
    <div className="space-y-4 max-w-7xl mx-auto animate-pulse">
      <div className="h-8 w-44 rounded-lg bg-muted/50" />
      <div className="rounded-xl border border-border bg-card h-[500px] flex items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="h-16 w-16 rounded-full bg-muted/30 mx-auto" />
          <div className="h-4 w-32 rounded bg-muted/30 mx-auto" />
        </div>
      </div>
    </div>
  );
}
