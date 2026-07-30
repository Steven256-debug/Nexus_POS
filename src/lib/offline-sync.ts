'use client';

import { getPendingSales, markSaleSynced, markSaleFailed } from './offline-db';
import { processSale } from '@/app/actions/sales';
import { toast } from 'sonner';

let isSyncing = false;

export async function syncOfflineSales(): Promise<number> {
  if (isSyncing || typeof window === 'undefined' || !navigator.onLine) {
    return 0;
  }

  isSyncing = true;
  let count = 0;

  try {
    const pending = await getPendingSales();
    if (pending.length === 0) {
      isSyncing = false;
      return 0;
    }

    toast.info(`Syncing ${pending.length} offline sale(s) to server...`);

    for (const saleItem of pending) {
      try {
        await processSale(saleItem.saleInput as any);
        await markSaleSynced(saleItem.id);
        count++;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown sync error';
        console.error(`Error syncing sale ${saleItem.id}:`, message);
        // Mark as failed instead of silently skipping — prevents duplicate retries
        await markSaleFailed(saleItem.id, message);
      }
    }

    if (count > 0) {
      toast.success(`Successfully synced ${count} offline sale(s)!`);
    }
  } catch (err) {
    console.error('Auto-sync engine error:', err);
  } finally {
    isSyncing = false;
  }

  return count;
}

export function initOfflineSyncListeners() {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', () => {
    toast.success('Network reconnected! Checking for offline sales...');
    syncOfflineSales();
  });

  window.addEventListener('offline', () => {
    toast.warning('Network connection lost. Offline checkout active.');
  });
}
