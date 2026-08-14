'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Error caught:', error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-card p-8 rounded-3xl border border-border shadow-lg text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-foreground">Something went wrong!</h2>
          <p className="text-muted-foreground text-sm">
            We encountered an unexpected error. Our team has been notified.
          </p>
        </div>
        <Button onClick={() => reset()} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">
          Try again
        </Button>
      </div>
    </div>
  );
}
