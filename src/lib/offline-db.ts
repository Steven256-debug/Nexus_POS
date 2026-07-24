/**
 * Native IndexedDB wrapper for POS Offline Resilience.
 * Stores cached product catalog and queued offline sales.
 */

const DB_NAME = 'NexusPOS_OfflineDB';
const DB_VERSION = 1;

export interface OfflineProduct {
  id: string;
  name: string;
  sku: string;
  pricePerUnit: number;
  stockQuantity: number;
  minStockAlert: number;
  category?: string | null;
  unit?: string | null;
}

export interface OfflineSale {
  id: string;
  saleInput: any;
  createdAt: string;
  synced: number; // 0 = false, 1 = true
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('pendingSales')) {
        const saleStore = db.createObjectStore('pendingSales', { keyPath: 'id' });
        saleStore.createIndex('synced', 'synced', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ─── Product Operations ──────────────────────────────────────────
export async function saveLocalProducts(products: OfflineProduct[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');

    products.forEach(p => {
      store.put({
        id: p.id,
        name: p.name,
        sku: p.sku,
        pricePerUnit: p.pricePerUnit,
        stockQuantity: p.stockQuantity,
        minStockAlert: p.minStockAlert,
        category: typeof p.category === 'object' ? (p.category as any)?.name : p.category,
      });
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB product save error:', err);
  }
}

export async function getLocalProducts(): Promise<OfflineProduct[]> {
  try {
    const db = await openDB();
    const tx = db.transaction('products', 'readonly');
    const store = tx.objectStore('products');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB get products error:', err);
    return [];
  }
}

// ─── Pending Sales Operations ───────────────────────────────────
export async function addPendingSale(sale: OfflineSale): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('pendingSales', 'readwrite');
  const store = tx.objectStore('pendingSales');
  store.put(sale);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingSales(): Promise<OfflineSale[]> {
  try {
    const db = await openDB();
    const tx = db.transaction('pendingSales', 'readonly');
    const store = tx.objectStore('pendingSales');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const all: OfflineSale[] = request.result || [];
        resolve(all.filter(s => s.synced === 0));
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB get pending sales error:', err);
    return [];
  }
}

export async function markSaleSynced(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('pendingSales', 'readwrite');
  const store = tx.objectStore('pendingSales');
  store.delete(id);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
