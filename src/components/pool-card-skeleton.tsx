export function PoolCardSkeleton() {
  return (
    <div className="rounded-xl border border-primary/5 bg-card overflow-hidden">
      <div className="h-[2px] w-full shimmer" />
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="h-5 w-40 rounded-md shimmer" />
          <div className="h-5 w-16 rounded-full shimmer" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-28 rounded-md shimmer" />
          <div className="h-4 w-20 rounded-md shimmer" />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <div className="h-3 w-24 rounded-md shimmer" />
            <div className="h-3 w-10 rounded-md shimmer" />
          </div>
          <div className="h-2 w-full rounded-full shimmer" />
        </div>
        <div className="h-3 w-32 rounded-md shimmer" />
      </div>
    </div>
  );
}
