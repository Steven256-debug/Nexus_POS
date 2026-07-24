'use client';

import { useEffect } from 'react';
import { initOfflineSyncListeners, syncOfflineSales } from '@/lib/offline-sync';

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initOfflineSyncListeners();
    // Attempt initial sync on load if online
    if (navigator.onLine) {
      syncOfflineSales();
    }
  }, []);

  return <>{children}</>;
}
