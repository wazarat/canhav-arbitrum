export function PoolCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="h-5 w-40 rounded bg-muted" />
        <div className="h-5 w-16 rounded-full bg-muted" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-28 rounded bg-muted" />
        <div className="h-4 w-20 rounded bg-muted" />
      </div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-3 w-10 rounded bg-muted" />
        </div>
        <div className="h-2 w-full rounded-full bg-muted" />
      </div>
      <div className="h-3 w-32 rounded bg-muted" />
    </div>
  );
}
