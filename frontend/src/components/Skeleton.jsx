const SKELETON_BASE = "bg-cream-200 dark:bg-stone-800 rounded-lg animate-pulse";

export function Skeleton({ className = "" }) {
  return <div className={`${SKELETON_BASE} ${className}`} />;
}

export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="card p-4 sm:p-5 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="space-y-2 pt-1">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-full" />
        ))}
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card p-3 sm:p-5 flex items-center gap-2 sm:gap-3">
      <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg shrink-0" />
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-12" />
      </div>
    </div>
  );
}

export function OrderRowSkeleton() {
  return (
    <div className="px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-4">
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 space-y-2">
        <Skeleton className="w-7 h-7 sm:w-9 sm:h-9 rounded-full shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <div className="text-right shrink-0 space-y-2">
        <Skeleton className="h-4 w-16 ml-auto" />
        <Skeleton className="h-8 w-20 ml-auto" />
      </div>
    </div>
  );
}

export function TableCardSkeleton() {
  return (
    <div className="border-2 border-cream-300 dark:border-stone-700 rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-16" />
        <div className="flex gap-1">
          <Skeleton className="w-6 h-6 rounded" />
          <Skeleton className="w-6 h-6 rounded" />
        </div>
      </div>
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-2 w-full rounded-full" />
      <Skeleton className="h-8 w-full rounded-lg" />
    </div>
  );
}

export function MenuCardSkeleton() {
  return (
    <div className="card p-3 sm:p-4 flex flex-col space-y-2 sm:space-y-3">
      <Skeleton className="h-36 sm:h-40 w-full rounded-xl" />
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-8 w-full rounded-lg" />
    </div>
  );
}

export function RestaurantCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <Skeleton className="h-40 sm:h-48 w-full" />
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="card p-4 sm:p-5 space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-64 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
