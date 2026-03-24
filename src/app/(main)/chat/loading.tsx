export default function Loading() {
  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col gap-0 rounded-xl border border-border bg-card overflow-hidden animate-pulse">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-muted/40" />
        <div className="h-5 w-24 rounded bg-muted/40" />
      </div>
      <div className="flex-1 p-4 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`flex gap-3 ${i % 2 === 1 ? "flex-row-reverse" : ""}`}>
            <div className="h-8 w-8 rounded-full bg-muted/40 shrink-0" />
            <div className={`h-12 rounded-xl bg-muted/30 ${i % 2 === 1 ? "w-2/5" : "w-3/5"}`} />
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-border">
        <div className="h-10 w-full rounded-xl bg-muted/30" />
      </div>
    </div>
  );
}
