'use client';

import { useEffect } from 'react';
import { initOfflineSyncListeners, syncOfflineSales } from '@/lib/offline-sync';

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize online/offline event listeners
    initOfflineSyncListeners();

    // Attempt to sync any pending offline sales on mount
    if (typeof window !== 'undefined' && navigator.onLine) {
      syncOfflineSales();
    }
  }, []);

  return <>{children}</>;
}
