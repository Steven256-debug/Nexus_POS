export default function Loading() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-pulse">
      {/* Banner Skeleton */}
      <div className="h-48 rounded-3xl bg-muted/60 w-full"></div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 rounded-3xl bg-muted/60 p-6"></div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="h-80 rounded-3xl bg-muted/60 w-full"></div>

      {/* Bottom Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-64 rounded-3xl bg-muted/60"></div>
        <div className="h-64 rounded-3xl bg-muted/60"></div>
      </div>
    </div>
  );
}
