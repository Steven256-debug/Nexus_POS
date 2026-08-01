'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  X, 
  PauseCircle, 
  ArrowLeft,
  Tag,
  Star,
  Layers,
  Percent
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AutoSizeText } from '@/components/auto-size-text';
import { processSale } from '@/app/actions/sales';
import { useRouter } from 'next/navigation';
import { AddProductModal } from './add-product-modal';
import { toast } from 'sonner';
import { saveLocalProducts, addPendingSale, getLocalProducts } from '@/lib/offline-db';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import type { CartItem, ProductWithRelations, PosClientProps } from '@/types';

// ─── Cart Panel Component ──────────────────────────────────────
function CartPanel({
  cart,
  updateQuantity,
  removeFromCart,
  subtotal,
  discountPercent,
  setDiscountPercent,
  discountAmount,
  tax,
  taxPercent,
  total,
  isProcessing,
  onCashCheckout,
  onQuotationCheckout,
  onSplitPayOpen,
}: {
  cart: CartItem[];
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  subtotal: number;
  discountPercent: number;
  setDiscountPercent: (v: number) => void;
  discountAmount: number;
  tax: number;
  taxPercent: number;
  total: number;
  isProcessing: boolean;
  onCashCheckout: () => void;
  onQuotationCheckout: () => void;
  onSplitPayOpen: () => void;
}) {
  return (
    <div className="w-full lg:w-[440px] flex flex-col bg-card text-card-foreground rounded-3xl border border-border shadow-sm overflow-hidden">
      {/* Cart Header */}
      <div className="p-5 border-b border-border bg-muted/40 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-600/10 text-blue-600 rounded-xl">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-black text-foreground">Current Sale</h2>
        </div>
        <Badge variant="secondary" className="font-bold text-xs bg-blue-500/10 text-blue-600">
          {cart.reduce((a, c) => a + c.quantity, 0)} Items
        </Badge>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20 min-h-[300px] max-h-[420px]">
        {cart.length === 0 ? (
          <div className="h-full py-16 flex flex-col items-center justify-center text-muted-foreground space-y-3">
            <div className="w-20 h-20 rounded-full bg-muted/60 flex items-center justify-center mb-2">
              <ShoppingCart className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="font-bold text-foreground">Your cart is empty</p>
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Scan a barcode, tap a product tile, or type to search.
            </p>
          </div>
        ) : (
          cart.map(item => (
            <div key={item.id} className="p-3.5 bg-card rounded-2xl border border-border/70 shadow-sm flex flex-col gap-2 group">
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{item.sku}</span>
                  <h4 className="font-bold text-sm text-foreground leading-tight">{item.name}</h4>
                </div>
                <span className="font-black text-sm text-blue-600">GH₵{(item.price * item.quantity).toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-border/50">
                <div className="flex items-center gap-1 bg-muted/60 rounded-xl p-1 border border-border/60">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 hover:bg-card rounded-lg transition-colors">
                    <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <span className="w-8 text-center font-extrabold text-xs">{item.quantity} {item.unit}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 hover:bg-card rounded-lg transition-colors">
                    <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>

                <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Footer Calculations & Payment Shortcuts */}
      <div className="p-5 border-t border-border bg-card space-y-4">
        <div className="space-y-2 text-xs font-semibold">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="text-foreground font-bold">GH₵{subtotal.toFixed(2)}</span>
          </div>
          {discountPercent > 0 && (
            <div className="flex justify-between text-amber-600">
              <span>Discount ({discountPercent}%)</span>
              <span className="font-bold">-GH₵{discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span>Tax ({taxPercent}%)</span>
            <span className="text-foreground font-bold">GH₵{tax.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Percent className="w-3.5 h-3.5 text-muted-foreground" />
            <Input
              type="number"
              min="0"
              max="100"
              step="1"
              placeholder="Discount %"
              value={discountPercent || ''}
              onChange={e => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
              className="h-8 text-xs font-bold rounded-lg w-24"
            />
            <span className="text-[10px] text-muted-foreground">% discount</span>
          </div>
          <div className="flex justify-between items-baseline pt-3 border-t border-dashed border-border">
            <span className="text-sm font-bold text-foreground">Total Due</span>
            <span className="text-3xl font-black text-blue-600 tracking-tight">GH₵{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Action Buttons: Quotation / Credit | Multiple Pay | Cash */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <Button
            variant="outline"
            disabled={cart.length === 0 || isProcessing}
            onClick={onQuotationCheckout}
            className="h-12 flex flex-col items-center justify-center p-2 rounded-xl text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 font-bold text-[11px] leading-tight"
            title="Quotation / Credit Sale (F9)"
          >
            <span>{isProcessing ? 'Processing...' : 'Quotation / Credit'}</span>
          </Button>

          <Button
            disabled={cart.length === 0 || isProcessing}
            onClick={onSplitPayOpen}
            className="h-12 flex flex-col items-center justify-center p-2 rounded-xl text-white bg-blue-600 hover:bg-blue-700 font-bold text-[11px] leading-tight shadow-md shadow-blue-500/20"
            title="Multiple Pay (F8)"
          >
            <span>{isProcessing ? 'Processing...' : 'Multiple Pay'}</span>
          </Button>

          <Button
            disabled={cart.length === 0 || isProcessing}
            onClick={onCashCheckout}
            className="h-12 flex flex-col items-center justify-center p-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 font-bold text-[11px] leading-tight shadow-md shadow-emerald-500/20"
            title="Cash (F2)"
          >
            <span>{isProcessing ? 'Processing...' : 'Cash Checkout'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Split Payment Dialog Component ────────────────────────────
function SplitPaymentDialog({
  isOpen,
  onClose,
  total,
  isProcessing,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  isProcessing: boolean;
  onConfirm: (cashAmount: number, momoAmount: number, cardAmount: number) => void;
}) {
  const [cashAmount, setCashAmount] = useState<string>('');
  const [momoAmount, setMomoAmount] = useState<string>('');
  const [cardAmount, setCardAmount] = useState<string>('');

  const handleConfirm = () => {
    onConfirm(
      parseFloat(cashAmount || '0'),
      parseFloat(momoAmount || '0'),
      parseFloat(cardAmount || '0')
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-center mb-1">Multiple Payment Split</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-3">
          <div className="text-center p-4 bg-muted/60 rounded-2xl border border-border">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Total Amount Due</p>
            <p className="text-4xl font-black text-blue-600">GH₵{total.toFixed(2)}</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-emerald-600" /> Cash Amount (GH₵)
              </label>
              <Input type="number" placeholder="0.00" value={cashAmount} onChange={e => setCashAmount(e.target.value)} className="rounded-xl h-11 font-bold text-lg" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-blue-600" /> Mobile Money (GH₵)
              </label>
              <Input type="number" placeholder="0.00" value={momoAmount} onChange={e => setMomoAmount(e.target.value)} className="rounded-xl h-11 font-bold text-lg" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-purple-600" /> Card Payment (GH₵)
              </label>
              <Input type="number" placeholder="0.00" value={cardAmount} onChange={e => setCardAmount(e.target.value)} className="rounded-xl h-11 font-bold text-lg" />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6">
            {isProcessing ? 'Processing...' : 'Confirm Split Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Product Catalog Component ─────────────────────────────────
function ProductCatalog({
  products,
  cart,
  searchTerm,
  setSearchTerm,
  addToCart,
  onAddProductOpen,
}: {
  products: ProductWithRelations[];
  cart: CartItem[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  addToCart: (product: ProductWithRelations) => void;
  onAddProductOpen: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'categories' | 'brands' | 'featured'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');

  const categoriesList = Array.from(new Set(products.map(p => p.category?.name || 'General'))).filter(Boolean);
  const brandsList = Array.from(new Set(products.map(p => p.brand?.name || 'Unbranded'))).filter(Boolean);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === 'featured') return p.isFeatured;
    if (activeTab === 'brands') {
      const bName = p.brand?.name || 'Unbranded';
      return selectedBrand === 'ALL' || bName === selectedBrand;
    }
    const cName = p.category?.name || 'General';
    return selectedCategory === 'ALL' || cName === selectedCategory;
  });

  const handleBarcodeSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      const exactMatches = products.filter(p =>
        p.sku.toLowerCase() === searchTerm.toLowerCase() ||
        p.barcode?.toLowerCase() === searchTerm.toLowerCase()
      );
      if (exactMatches.length === 1) {
        addToCart(exactMatches[0]);
        setSearchTerm('');
      } else {
        toast.error(`Barcode not found: ${searchTerm}`);
        setSearchTerm('');
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-card text-card-foreground rounded-3xl border border-border shadow-sm overflow-hidden">
      {/* Search & Tabs Header */}
      <div className="p-5 border-b border-border space-y-4 bg-muted/30">
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Enter Product name / SKU / Scan bar code..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={handleBarcodeSearch}
              className="pl-12 h-13 text-base rounded-2xl bg-card border-border shadow-sm focus-visible:ring-blue-500"
            />
          </div>
          <Button
            onClick={onAddProductOpen}
            className="h-13 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center gap-1 shrink-0"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button onClick={() => setActiveTab('categories')} className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${activeTab === 'categories' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-card border border-border text-muted-foreground hover:bg-muted'}`}>
            <Layers className="w-4 h-4" />
            <span>Category ({categoriesList.length})</span>
          </button>
          <button onClick={() => setActiveTab('brands')} className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${activeTab === 'brands' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-card border border-border text-muted-foreground hover:bg-muted'}`}>
            <Tag className="w-4 h-4" />
            <span>Brands ({brandsList.length})</span>
          </button>
          <button onClick={() => setActiveTab('featured')} className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${activeTab === 'featured' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-card border border-border text-muted-foreground hover:bg-muted'}`}>
            <Star className="w-4 h-4 fill-current" />
            <span>Featured Products</span>
          </button>
        </div>
      </div>

      {/* Product Grid */}
      <div className="flex-1 p-5 overflow-y-auto bg-muted/20">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map(product => {
            const inCart = cart.find(c => c.id === product.id)?.quantity || 0;
            const available = product.stockQuantity - inCart;
            const isOutOfStock = available <= 0;
            const unitName = product.unit?.shortName || 'Pc(s)';

            return (
              <div
                key={product.id}
                onClick={() => !isOutOfStock && addToCart(product)}
                className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                  isOutOfStock
                    ? 'border-red-200 bg-red-500/5 opacity-60 cursor-not-allowed'
                    : 'border-border bg-card hover:border-blue-500 hover:shadow-lg active:scale-95'
                }`}
              >
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                      ({product.sku})
                    </span>
                    {product.isFeatured && (
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    )}
                  </div>
                  <h3 className="font-extrabold text-foreground text-sm leading-tight line-clamp-2">
                    {product.name}
                  </h3>
                </div>

                <div className="pt-3 border-t border-border/60 space-y-1.5">
                  <p className="font-black text-lg text-blue-600">
                    GH₵{Number(product.pricePerUnit).toFixed(2)}
                  </p>
                  <div className="text-[11px] font-bold">
                    <span className={isOutOfStock ? "text-red-500" : "text-emerald-600"}>
                      {available.toFixed(0)} {unitName} in stock
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground space-y-2">
              <Search className="w-10 h-10 opacity-30" />
              <p className="font-bold text-base">No matching products found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main POS Client Component ─────────────────────────────────
export default function PosClient({ 
  initialProducts,
  initialResumedCart = [],
  resumedSaleId = null,
  taxRate = 0.15
}: PosClientProps) {
  const router = useRouter();
  const [products, setProducts] = useState<ProductWithRelations[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
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

  // Cash Checkout (Online or Offline)
  const handleInstantCashCheckout = useCallback(async () => {
    setIsProcessing(true);

    const saleInput = {
      paymentMethod: 'CASH' as const,
      status: 'COMPLETED' as const,
      items: cart.map(item => ({ productId: item.id, quantity: item.quantity, priceAtSale: item.price })),
      resumedSaleId: resumedSaleId || undefined,
      discountAmount,
      taxAmount: tax,
    };

    if (!navigator.onLine) {
      try {
        const offlineId = crypto.randomUUID();
        await addPendingSale({
          id: offlineId,
          idempotencyKey: `offline-${offlineId}`,
          saleInput,
          createdAt: new Date().toISOString(),
          synced: 0
        });

        setProducts(prev => prev.map(p => {
          const cartItem = cart.find(c => c.id === p.id);
          if (cartItem) {
            return { ...p, stockQuantity: Math.max(0, p.stockQuantity - cartItem.quantity) };
          }
          return p;
        }));

        setCart([]);
        toast.warning('Offline mode: Sale saved locally. Will sync when back online!');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        toast.error('Failed to save offline sale: ' + message);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    try {
      const sale = await processSale(saleInput);
      setCart([]);
      toast.success('Sale completed successfully');
      router.push(`/receipt/${sale.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error('Checkout failed: ' + message);
    } finally {
      setIsProcessing(false);
    }
  }, [cart, resumedSaleId, discountAmount, tax, router]);

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

  // Split Payment Checkout
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
    try {
      const payments = [];
      if (cashVal > 0) payments.push({ method: 'CASH', amount: cashVal });
      if (momoVal > 0) payments.push({ method: 'MOBILE_MONEY', amount: momoVal });
      if (cardVal > 0) payments.push({ method: 'CARD', amount: cardVal });

      const sale = await processSale({
        paymentMethod: 'MULTIPLE',
        status: 'COMPLETED',
        items: cart.map(item => ({ productId: item.id, quantity: item.quantity, priceAtSale: item.price })),
        payments,
        resumedSaleId: resumedSaleId || undefined,
        discountAmount,
        taxAmount: tax,
      });

      setCart([]);
      setIsSplitPayOpen(false);
      toast.success('Split payment completed');
      router.push(`/receipt/${sale.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error('Split payment failed: ' + message);
    } finally {
      setIsProcessing(false);
    }
  }, [cart, resumedSaleId, discountAmount, tax, total, router]);

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
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 font-bold text-xs border border-blue-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Cash Register Active
          </div>
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
