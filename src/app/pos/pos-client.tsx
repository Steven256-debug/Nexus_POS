'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  X, 
  PauseCircle, 
  ArrowLeft,
  Wifi,
  WifiOff,
  CloudUpload,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { processSale } from '@/app/actions/sales';
import { useRouter } from 'next/navigation';
import { AddProductModal } from './add-product-modal';
import { CartPanel } from './cart-panel';
import { SplitPaymentDialog } from './split-payment-dialog';
import { ProductCatalog } from './product-catalog';
import { toast } from 'sonner';
import { 
  saveLocalProducts, 
  addPendingSale, 
  getLocalProducts, 
  getPendingSalesCount,
  type OfflineSaleInput 
} from '@/lib/offline-db';
import { syncOfflineSales, isNetworkError } from '@/lib/offline-sync';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import type { CartItem, ProductWithRelations, PosClientProps } from '@/types';

export default function PosClient({ 
  initialProducts,
  initialResumedCart = [],
  resumedSaleId = null,
  taxRate = 0.15
}: PosClientProps) {
  const router = useRouter();
  const [products, setProducts] = useState<ProductWithRelations[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [cart, setCart] = useState<CartItem[]>(initialResumedCart);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Modals
  const [isSplitPayOpen, setIsSplitPayOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);

  const addToCart = useCallback((product: ProductWithRelations) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) return prev;
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      if (product.stockQuantity <= 0) return prev;
      return [
        ...prev, 
        { 
          id: product.id, 
          name: product.name, 
          sku: product.sku,
          unit: product.unit?.shortName || 'Pc(s)',
          price: Number(product.pricePerUnit), 
          quantity: 1, 
          maxStock: product.stockQuantity 
        }
      ];
    });
  }, []);

  // Global Hardware Barcode Scanner integration
  useBarcodeScanner(useCallback((barcode: string) => {
    if (isProcessing) return;
    const exactMatches = products.filter(p =>
      p.sku.toLowerCase() === barcode.toLowerCase() ||
      p.barcode?.toLowerCase() === barcode.toLowerCase()
    );
    
    if (exactMatches.length > 0) {
      const product = exactMatches[0];
      if (product.stockQuantity <= 0) {
        toast.error(`Cannot add ${product.name}: Out of stock!`);
        return;
      }
      addToCart(product);
      toast.success(`Scanned: ${product.name}`);
    } else {
      toast.error(`Barcode not found: ${barcode}`);
    }
  }, [products, addToCart, isProcessing]));

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      getPendingSalesCount().then(setPendingCount);

      const handleOnline = () => {
        setIsOnline(true);
        getPendingSalesCount().then(setPendingCount);
      };
      const handleOffline = () => {
        setIsOnline(false);
      };
      const handleSynced = () => {
        getPendingSalesCount().then(setPendingCount);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      window.addEventListener('offline-sales-synced', handleSynced);

      // Cache products to local IndexedDB
      if (initialProducts && initialProducts.length > 0) {
        saveLocalProducts(initialProducts as any);
      } else {
        // Fallback: If offline and SSR failed, load from local cache
        getLocalProducts().then(cached => {
          if (cached && cached.length > 0) {
            setProducts(cached as unknown as ProductWithRelations[]);
          }
        });
      }

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('offline-sales-synced', handleSynced);
      };
    }
  }, [initialProducts]);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const tax = (subtotal - discountAmount) * taxRate;
  const total = subtotal - discountAmount + tax;
  const taxPercent = Math.round(taxRate * 100);


  const updateQuantity = useCallback((id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta;
        if (newQ > 0 && newQ <= item.maxStock) return { ...item, quantity: newQ };
      }
      return item;
    }));
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  }, []);

  // Hold Sale
  const handleHoldSale = useCallback(async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      await processSale({
        paymentMethod: 'HOLD',
        status: 'DRAFT',
        items: cart.map(item => ({ productId: item.id, quantity: item.quantity, priceAtSale: item.price })),
        resumedSaleId: resumedSaleId || undefined,
        discountAmount,
        taxAmount: tax,
      });
      setCart([]);
      toast.success('Sale held as draft');
      router.push('/sales/drafts');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error('Hold sale failed: ' + message);
    } finally {
      setIsProcessing(false);
    }
  }, [cart, resumedSaleId, discountAmount, tax, router]);

  // Save sale locally when offline or during network drop
  const queueOfflineSale = useCallback(async (saleInput: OfflineSaleInput, customMsg?: string) => {
    const offlineId = crypto.randomUUID();
    await addPendingSale({
      id: offlineId,
      idempotencyKey: `offline-${offlineId}`,
      saleInput,
      createdAt: new Date().toISOString(),
      synced: 0
    });

    // Update in-memory stock immediately so cashier continues ringing items smoothly
    setProducts(prev => prev.map(p => {
      const cartItem = cart.find(c => c.id === p.id);
      if (cartItem) {
        return { ...p, stockQuantity: Math.max(0, p.stockQuantity - cartItem.quantity) };
      }
      return p;
    }));

    setCart([]);
    setIsSplitPayOpen(false);
    const count = await getPendingSalesCount();
    setPendingCount(count);
    toast.warning(customMsg || 'Offline mode: Sale safely queued locally. Will sync automatically when back online!');
  }, [cart]);

  // Cash Checkout (Online or Offline)
  const handleInstantCashCheckout = useCallback(async () => {
    setIsProcessing(true);

    const saleInput: OfflineSaleInput = {
      paymentMethod: 'CASH',
      status: 'COMPLETED',
      items: cart.map(item => ({ productId: item.id, quantity: item.quantity, priceAtSale: item.price })),
      resumedSaleId: resumedSaleId || undefined,
      discountAmount,
      taxAmount: tax,
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      try {
        await queueOfflineSale(saleInput);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        toast.error('Failed to save offline sale: ' + message);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    try {
      const sale = await processSale(saleInput as any);
      setCart([]);
      toast.success('Sale completed successfully');
      router.push(`/receipt/${sale.id}`);
    } catch (err: unknown) {
      if (isNetworkError(err)) {
        try {
          await queueOfflineSale(saleInput, 'Network dropped: Sale safely saved offline! Will auto-sync when connection restores.');
        } catch (saveErr) {
          toast.error('Failed to save offline sale: ' + (saveErr instanceof Error ? saveErr.message : 'Unknown error'));
        }
      } else {
        const message = err instanceof Error ? err.message : 'Unknown error';
        toast.error('Checkout failed: ' + message);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [cart, resumedSaleId, discountAmount, tax, router, queueOfflineSale]);

  // Quotation Checkout
  const handleQuotationCheckout = useCallback(async () => {
    setIsProcessing(true);
    try {
      const sale = await processSale({
        paymentMethod: 'CREDIT',
        status: 'QUOTATION',
        items: cart.map(item => ({ productId: item.id, quantity: item.quantity, priceAtSale: item.price })),
        resumedSaleId: resumedSaleId || undefined,
        discountAmount,
        taxAmount: tax,
      });
      setCart([]);
      toast.success('Quotation created successfully');
      router.push(`/receipt/${sale.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error('Quotation creation failed: ' + message);
    } finally {
      setIsProcessing(false);
    }
  }, [cart, resumedSaleId, discountAmount, tax, router]);

  // Split Payment Checkout (Online or Offline)
  const handleSplitCheckout = useCallback(async (cashVal: number, momoVal: number, cardVal: number) => {
    if (cashVal < 0 || momoVal < 0 || cardVal < 0) {
      toast.error('Payment amounts cannot be negative');
      return;
    }
    const totalPaid = cashVal + momoVal + cardVal;
    if (totalPaid < total) {
      toast.warning(`Split payment total (GH₵${totalPaid.toFixed(2)}) is less than total amount due (GH₵${total.toFixed(2)})`);
      return;
    }

    setIsProcessing(true);
    const payments = [];
    if (cashVal > 0) payments.push({ method: 'CASH', amount: cashVal });
    if (momoVal > 0) payments.push({ method: 'MOBILE_MONEY', amount: momoVal });
    if (cardVal > 0) payments.push({ method: 'CARD', amount: cardVal });

    const saleInput: OfflineSaleInput = {
      paymentMethod: 'MULTIPLE',
      status: 'COMPLETED',
      items: cart.map(item => ({ productId: item.id, quantity: item.quantity, priceAtSale: item.price })),
      payments,
      resumedSaleId: resumedSaleId || undefined,
      discountAmount,
      taxAmount: tax,
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      try {
        await queueOfflineSale(saleInput, 'Offline mode: Split payment saved locally. Will sync when back online!');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        toast.error('Failed to save offline split sale: ' + message);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    try {
      const sale = await processSale(saleInput as any);
      setCart([]);
      setIsSplitPayOpen(false);
      toast.success('Split payment completed');
      router.push(`/receipt/${sale.id}`);
    } catch (err: unknown) {
      if (isNetworkError(err)) {
        try {
          await queueOfflineSale(saleInput, 'Network dropped: Split payment safely saved offline! Will auto-sync.');
        } catch (saveErr) {
          toast.error('Failed to save offline split sale: ' + (saveErr instanceof Error ? saveErr.message : 'Unknown error'));
        }
      } else {
        const message = err instanceof Error ? err.message : 'Unknown error';
        toast.error('Split payment failed: ' + message);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [cart, resumedSaleId, discountAmount, tax, total, router, queueOfflineSale]);

  // Keyboard Shortcuts — using useCallback handlers avoids stale closures
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isProcessing) return;
      if (e.key === 'F2') {
        e.preventDefault();
        if (cart.length > 0) handleInstantCashCheckout();
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0) setIsSplitPayOpen(true);
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0) handleQuotationCheckout();
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) handleHoldSale();
      } else if (e.key === 'Escape') {
        setIsSplitPayOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, isProcessing, handleInstantCashCheckout, handleQuotationCheckout, handleHoldSale]);

  return (
    <div className="flex flex-col gap-4 h-full min-h-[650px] animate-in fade-in duration-300">
      {/* Top POS Action Toolbar */}
      <div className="bg-card text-card-foreground p-3 rounded-2xl border border-border flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/')} className="rounded-xl flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>

          {/* Online / Offline Status Indicator */}
          {isOnline ? (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 font-bold text-xs border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <Wifi className="w-3.5 h-3.5" />
              Online Register
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 font-bold text-xs border border-amber-500/20">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <WifiOff className="w-3.5 h-3.5" />
              Offline Mode Active
            </div>
          )}

          {/* Pending Offline Sales Counter & Sync Button */}
          {pendingCount > 0 && (
            <button
              onClick={() => {
                syncOfflineSales().then(() => getPendingSalesCount().then(setPendingCount));
              }}
              title="Click to trigger immediate server sync"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 font-bold text-xs border border-blue-500/20 transition-all cursor-pointer"
            >
              <CloudUpload className="w-3.5 h-3.5 animate-bounce" />
              <span>{pendingCount} Queued</span>
              <RefreshCw className="w-3 h-3 ml-0.5 opacity-70" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setCart([])} className="p-2 text-muted-foreground hover:text-red-500 hover:bg-muted rounded-xl transition-colors" title="Cancel Transaction (Esc)">
            <X className="w-4 h-4" />
          </button>
          <button 
            onClick={handleHoldSale} 
            disabled={cart.length === 0 || isProcessing} 
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors disabled:opacity-50" 
            title="Pause / Hold Sale (F4)"
          >
            <PauseCircle className="w-4 h-4" />
          </button>
          <button onClick={() => setIsAddProductOpen(true)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm">
            <Plus className="w-3.5 h-3.5" /> Quick Add Product
          </button>
        </div>
      </div>

      {/* Main Dual-Column POS View */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        {/* Left Column: Cart */}
        <CartPanel
          cart={cart}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
          subtotal={subtotal}
          discountPercent={discountPercent}
          setDiscountPercent={setDiscountPercent}
          discountAmount={discountAmount}
          tax={tax}
          taxPercent={taxPercent}
          total={total}
          isProcessing={isProcessing}
          onCashCheckout={handleInstantCashCheckout}
          onQuotationCheckout={handleQuotationCheckout}
          onSplitPayOpen={() => setIsSplitPayOpen(true)}
        />

        {/* Right Column: Product Catalog */}
        <ProductCatalog
          products={products}
          cart={cart}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          addToCart={addToCart}
          onAddProductOpen={() => setIsAddProductOpen(true)}
        />
      </div>

      {/* Split Payment Dialog */}
      <SplitPaymentDialog
        isOpen={isSplitPayOpen}
        onClose={() => setIsSplitPayOpen(false)}
        total={total}
        isProcessing={isProcessing}
        onConfirm={handleSplitCheckout}
      />

      {/* Quick Add Product Modal */}
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onProductAdded={async () => {
          const updated = await fetch('/api/products').then(r => r.json()).catch(() => []);
          if (updated.length > 0) setProducts(updated);
        }}
      />
    </div>
  );
}
