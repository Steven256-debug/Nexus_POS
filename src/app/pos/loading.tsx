export default function PosLoading() {
  return (
    <div className="flex flex-col gap-4 h-full min-h-[650px] animate-pulse">
      {/* Top Toolbar Skeleton */}
      <div className="bg-card p-3 rounded-2xl border border-border flex justify-between items-center h-[62px]">
        <div className="w-40 h-9 bg-muted rounded-xl"></div>
        <div className="flex gap-2">
          <div className="w-9 h-9 bg-muted rounded-xl"></div>
          <div className="w-9 h-9 bg-muted rounded-xl"></div>
          <div className="w-36 h-9 bg-muted rounded-xl"></div>
        </div>
      </div>

      {/* Main Dual-Column Skeleton */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        {/* Left Column: Cart Skeleton */}
        <div className="w-full lg:w-[440px] flex flex-col bg-card rounded-3xl border border-border">
          <div className="p-5 border-b border-border flex justify-between items-center h-[72px]">
            <div className="w-32 h-6 bg-muted rounded-md"></div>
            <div className="w-16 h-6 bg-muted rounded-md"></div>
          </div>
          <div className="flex-1 p-4 space-y-4">
            <div className="h-20 bg-muted/60 rounded-2xl"></div>
            <div className="h-20 bg-muted/60 rounded-2xl"></div>
          </div>
          <div className="p-5 border-t border-border space-y-4 bg-card">
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-12 bg-muted rounded-xl w-full mt-4"></div>
          </div>
        </div>

        {/* Right Column: Catalog Skeleton */}
        <div className="flex-1 flex flex-col bg-card rounded-3xl border border-border">
          <div className="p-5 border-b border-border space-y-4">
            <div className="h-12 bg-muted rounded-2xl w-full"></div>
            <div className="flex gap-2">
              <div className="w-24 h-9 bg-muted rounded-xl"></div>
              <div className="w-24 h-9 bg-muted rounded-xl"></div>
              <div className="w-32 h-9 bg-muted rounded-xl"></div>
            </div>
          </div>
          <div className="flex-1 p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 bg-muted/20">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-40 bg-muted/60 rounded-2xl border border-border/50"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
