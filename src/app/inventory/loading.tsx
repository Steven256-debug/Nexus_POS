export default function InventoryLoading() {
  return (
    <div className="space-y-8 animate-pulse max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 bg-muted/60 rounded-xl w-56"></div>
          <div className="h-4 bg-muted/60 rounded-lg w-80"></div>
        </div>
        <div className="h-10 bg-muted/60 rounded-xl w-36"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 bg-muted/60 rounded-2xl"></div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-44 bg-card border border-border rounded-2xl p-6"></div>
        ))}
      </div>
    </div>
  );
}
