'use client';

import { useEffect } from 'react';
import { initOfflineSyncListeners, syncOfflineSales } from '@/lib/offline-sync';

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 1. Initialize online/offline event listeners
    initOfflineSyncListeners();

    // 2. Register Service Worker for offline PWA asset caching
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('Nexus POS Service Worker registered:', reg.scope);
          })
          .catch((err) => {
            console.warn('Nexus POS Service Worker registration failed:', err);
          });
      });
    }

    // 3. Attempt to sync any pending offline sales on mount
    if (typeof window !== 'undefined' && navigator.onLine) {
      syncOfflineSales();
    }

    // 4. Background heartbeat sync every 30s when online
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && navigator.onLine) {
        syncOfflineSales();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
}

