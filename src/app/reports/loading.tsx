export default function ReportsLoading() {
  return (
    <div className="space-y-8 animate-pulse max-w-7xl mx-auto pb-12">
      <div className="space-y-2">
        <div className="h-8 bg-muted/60 rounded-xl w-64"></div>
        <div className="h-4 bg-muted/60 rounded-lg w-96"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-muted/60 rounded-3xl"></div>
        ))}
      </div>

      <div className="h-80 bg-muted/60 rounded-3xl w-full"></div>
    </div>
  );
}
