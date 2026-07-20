import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full text-muted-foreground animate-in fade-in duration-500">
      <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
      <h2 className="text-xl font-semibold text-foreground">Loading...</h2>
      <p className="text-sm mt-2">Fetching your data securely.</p>
    </div>
  );
}
