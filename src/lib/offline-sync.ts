'use client';

import { getPendingSales, markSaleSynced, markSaleFailed } from './offline-db';
import { processSale } from '@/app/actions/sales';
import { toast } from 'sonner';

let isSyncing = false;

export function isNetworkError(err: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes('fetch') ||
      msg.includes('network') ||
      msg.includes('failed to fetch') ||
      msg.includes('timeout') ||
      msg.includes('abort') ||
      msg.includes('connection') ||
      msg.includes('offline') ||
      msg.includes('econnrefused')
    );
  }
  return false;
}

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
      if (!navigator.onLine) {
        console.warn('Network lost during sync batch. Pausing sync.');
        break;
      }

      try {
        await processSale(saleItem.saleInput as any);
        await markSaleSynced(saleItem.id);
        count++;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown sync error';
        console.error(`Error syncing sale ${saleItem.id}:`, message);

        if (isNetworkError(err)) {
          // Keep in queue with synced: 0 so it will retry next time
          console.warn(`Sync paused for sale ${saleItem.id} due to network interruption. Retrying later.`);
          break;
        } else {
          // Permanent validation or server schema error
          await markSaleFailed(saleItem.id, message);
        }
      }
    }

    if (count > 0) {
      toast.success(`Successfully synced ${count} offline sale(s)!`);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('offline-sales-synced', { detail: { count } }));
      }
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

