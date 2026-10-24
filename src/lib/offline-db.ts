/**
 * Native IndexedDB wrapper for POS Offline Resilience.
 * Stores cached product catalog and queued offline sales.
 */

const DB_NAME = 'NexusPOS_OfflineDB';
const DB_VERSION = 2; // Bumped for idempotencyKey field

export interface OfflineProduct {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  pricePerUnit: number;
  costPrice?: number;
  stockQuantity: number;
  minStockAlert: number;
  category?: { id?: string; name: string } | string | null;
  brand?: { id?: string; name: string } | string | null;
  unit?: { id?: string; name?: string; shortName: string } | string | null;
  imageUrl?: string | null;
  isFeatured?: boolean;
}

export interface OfflineSaleInput {
  paymentMethod: string;
  status: string;
  items: { productId: string; quantity: number; priceAtSale: number }[];
  payments?: { method: string; amount: number }[];
  customerId?: string | null;
  note?: string | null;
  resumedSaleId?: string;
  discountAmount: number;
  taxAmount: number;
}

export interface OfflineSale {
  id: string;
  idempotencyKey: string;
  saleInput: OfflineSaleInput;
  createdAt: string;
  synced: number; // 0 = false, 1 = true, -1 = failed
  syncError?: string;
  retryCount?: number;
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
        saleStore.createIndex('idempotencyKey', 'idempotencyKey', { unique: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ─── Product Operations ──────────────────────────────────────────
export async function saveLocalProducts(products: (OfflineProduct | any)[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');

    products.forEach(p => {
      const cat = typeof p.category === 'object' && p.category 
        ? { id: p.category.id || '', name: p.category.name || '' } 
        : (typeof p.category === 'string' ? { id: '', name: p.category } : null);

      const br = typeof p.brand === 'object' && p.brand 
        ? { id: p.brand.id || '', name: p.brand.name || '' } 
        : (typeof p.brand === 'string' ? { id: '', name: p.brand } : null);

      const un = typeof p.unit === 'object' && p.unit 
        ? { id: p.unit.id || '', name: p.unit.name || '', shortName: p.unit.shortName || p.unit.name || '' } 
        : (typeof p.unit === 'string' ? { id: '', name: p.unit, shortName: p.unit } : null);

      store.put({
        id: p.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode ?? null,
        pricePerUnit: Number(p.pricePerUnit),
        costPrice: p.costPrice ? Number(p.costPrice) : 0,
        stockQuantity: p.stockQuantity ?? 0,
        minStockAlert: p.minStockAlert ?? 0,
        category: cat,
        brand: br,
        unit: un,
        imageUrl: p.imageUrl ?? null,
        isFeatured: Boolean(p.isFeatured),
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

export async function markSaleFailed(id: string, error: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('pendingSales', 'readwrite');
  const store = tx.objectStore('pendingSales');

  const getReq = store.get(id);
  getReq.onsuccess = () => {
    const sale = getReq.result;
    if (sale) {
      sale.synced = -1; // -1 = failed, needs manual review
      sale.syncError = error;
      store.put(sale);
    }
  };

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingSalesCount(): Promise<number> {
  try {
    const sales = await getPendingSales();
    return sales.length;
  } catch {
    return 0;
  }
}
