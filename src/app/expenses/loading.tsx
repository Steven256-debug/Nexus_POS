export default function ExpensesLoading() {
  return (
    <div className="space-y-8 animate-pulse max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 bg-muted/60 rounded-xl w-48"></div>
          <div className="h-4 bg-muted/60 rounded-lg w-72"></div>
        </div>
        <div className="h-10 bg-muted/60 rounded-xl w-36"></div>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-12 bg-muted/50 rounded-xl w-full"></div>
        ))}
      </div>
    </div>
  );
}
