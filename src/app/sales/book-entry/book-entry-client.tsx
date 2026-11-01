'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  DollarSign, 
  CheckCircle2, 
  Search, 
  Package, 
  UserCheck, 
  Layers, 
  RotateCcw, 
  Receipt, 
  ArrowLeft,
  Sparkles,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { recordBookSale } from '@/app/actions/sales';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  sku: string;
  pricePerUnit: number;
  costPrice?: number;
  stockQuantity: number;
  category?: { name: string } | null;
}

interface Customer {
  id: string;
  name: string;
  phone?: string | null;
}

interface BookSaleEntryItem {
  productId?: string;
  customName?: string;
  name: string;
  sku?: string;
  quantity: number;
  priceAtSale: number;
  costAtSale?: number;
  currentStock?: number;
}

interface RecentBookSale {
  id: string;
  invoiceNo: string;
  totalAmount: number;
  paymentMethod: string;
  note?: string | null;
  createdAt: string | Date;
  items: {
    quantity: number;
    priceAtSale: number;
    product?: { name: string } | null;
  }[];
}

interface BookEntryClientProps {
  products: Product[];
  customers: Customer[];
  recentBookSales: RecentBookSale[];
  userRole?: string;
}

function getTodayDateStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getNowTimeStr(): string {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function BookEntryClient({ 
  products, 
  customers, 
  recentBookSales: initialRecent,
  userRole = 'EMPLOYEE' 
}: BookEntryClientProps) {
  // Sale details
  const [saleDate, setSaleDate] = useState<string>(getTodayDateStr());
  const [saleTime, setSaleTime] = useState<string>(getNowTimeStr());
  const [bookReference, setBookReference] = useState<string>('');
  const [customerId, setCustomerId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MOBILE_MONEY' | 'CARD' | 'CREDIT' | 'MULTIPLE'>('CASH');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number | string>('');
  const [deductStock, setDeductStock] = useState<boolean>(true);
  const [allowNegativeStock, setAllowNegativeStock] = useState<boolean>(true);

  // Items
  const [items, setItems] = useState<BookSaleEntryItem[]>([]);
  const [productSearch, setProductSearch] = useState<string>('');
  const [showProductDropdown, setShowProductDropdown] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [recentSales, setRecentSales] = useState<RecentBookSale[]>(initialRecent);

  // Custom Item Modal state
  const [isAddingCustom, setIsAddingCustom] = useState<boolean>(false);
  const [customItemName, setCustomItemName] = useState<string>('');
  const [customItemPrice, setCustomItemPrice] = useState<number | string>('');
  const [customItemQty, setCustomItemQty] = useState<number>(1);

  // Filtered products for quick search
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products.slice(0, 15);
    const q = productSearch.toLowerCase();
    return products
      .filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 20);
  }, [products, productSearch]);

  // Handle Preset Dates
  const handleDatePreset = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSaleDate(`${year}-${month}-${day}`);
  };

  // Add Product to Cart
  const handleSelectProduct = (prod: Product) => {
    setItems(prev => {
      const existingIdx = prev.findIndex(i => i.productId === prod.id);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx].quantity += 1;
        return copy;
      }
      return [
        ...prev,
        {
          productId: prod.id,
          name: prod.name,
          sku: prod.sku,
          quantity: 1,
          priceAtSale: Number(prod.pricePerUnit),
          costAtSale: Number(prod.costPrice || 0),
          currentStock: prod.stockQuantity,
        }
      ];
    });
    setProductSearch('');
    setShowProductDropdown(false);
  };

  // Add Custom / Uncataloged Item
  const handleAddCustomItem = () => {
    if (!customItemName.trim()) {
      toast.error('Please enter the custom item name');
      return;
    }
    const price = Number(customItemPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price for the item');
      return;
    }
    const qty = Number(customItemQty) || 1;

    setItems(prev => [
      ...prev,
      {
        customName: customItemName.trim(),
        name: customItemName.trim(),
        sku: 'MANUAL',
        quantity: qty,
        priceAtSale: price,
        costAtSale: 0,
        currentStock: 0,
      }
    ]);

    setCustomItemName('');
    setCustomItemPrice('');
    setCustomItemQty(1);
    setIsAddingCustom(false);
    toast.success('Custom item added to book sale');
  };

  // Item modification helpers
  const handleQtyChange = (idx: number, delta: number) => {
    setItems(prev => {
      const copy = [...prev];
      const newQty = copy[idx].quantity + delta;
      if (newQty <= 0) {
        copy.splice(idx, 1);
      } else {
        copy[idx].quantity = newQty;
      }
      return copy;
    });
  };

  const handlePriceChange = (idx: number, newPrice: number) => {
    setItems(prev => {
      const copy = [...prev];
      copy[idx].priceAtSale = Math.max(0, newPrice);
      return copy;
    });
  };

  const handleRemoveItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.priceAtSale * item.quantity), 0);
  }, [items]);

  const totalAmount = Math.max(0, subtotal - (Number(discountAmount) || 0));

  // Submit Handler
  const handleSubmit = async (keepDateForNext: boolean = false) => {
    if (items.length === 0) {
      toast.error('Please add at least one product sold in the book.');
      return;
    }

    if (!saleDate) {
      toast.error('Please specify the date of the sale.');
      return;
    }

    const fullDateTime = `${saleDate}T${saleTime || '12:00'}:00`;

    setIsSubmitting(true);
    try {
      const finalPaidAmount = paidAmount === '' ? totalAmount : Number(paidAmount);

      const saleData = {
        paymentMethod,
        status: 'COMPLETED' as const,
        items: items.map(item => ({
          productId: item.productId || null,
          customName: item.customName || null,
          quantity: item.quantity,
          priceAtSale: item.priceAtSale,
          costAtSale: item.costAtSale || 0,
        })),
        customerId: customerId || null,
        note: note.trim() || null,
        discountAmount: Number(discountAmount) || 0,
        taxAmount: 0,
        saleDate: fullDateTime,
        deductStock,
        allowNegativeStock,
        bookReference: bookReference.trim() || null,
        payments: [{
          method: paymentMethod,
          amount: finalPaidAmount
        }]
      };

      const result = await recordBookSale(saleData);

      toast.success(
        `Book sale recorded successfully! Invoice #${result.invoiceNo || result.id.slice(0, 8).toUpperCase()} (GH₵${result.totalAmount.toFixed(2)})`
      );

      // Add to recent sales
      setRecentSales(prev => [result as any, ...prev.slice(0, 9)]);

      // Clear or preserve inputs
      setItems([]);
      setPaidAmount('');
      setDiscountAmount(0);
      setNote('');
      if (!keepDateForNext) {
        setBookReference('');
      } else {
        toast.info('Form ready for the next entry on the same date.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to record book sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-2 sm:p-4 md:p-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-16">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link 
              href="/sales" 
              className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors bg-muted/60 px-2.5 py-1 rounded-lg"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sales History
            </Link>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              Manual & Book Sales Capture
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
            Record Book / Offline Sales
          </h1>
          <p className="text-muted-foreground text-xs sm:text-base mt-1">
            Capture sales recorded in paper books or offline receipts back into the POS database with accurate backdating and inventory control.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Link 
            href="/sales"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-border bg-card hover:bg-muted transition-colors shadow-sm"
          >
            <Receipt className="w-4 h-4 text-blue-600" />
            View All Sales
          </Link>
        </div>
      </div>

      {/* Main Grid: Form Left, Summary Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Form & Items (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Card 1: Book Entry Metadata (Date, Time, Reference, Customer) */}
          <div className="p-5 sm:p-6 bg-card text-card-foreground border border-border rounded-3xl shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2 font-bold text-base">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>1. Sale Date & Book Reference</span>
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground">
                All fields recorded into ledger
              </span>
            </div>

            {/* Quick Date Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1 shrink-0">
                Quick Date:
              </span>
              {[
                { label: 'Today', days: 0 },
                { label: 'Yesterday', days: 1 },
                { label: '2 Days Ago', days: 2 },
                { label: '3 Days Ago', days: 3 },
                { label: '1 Week Ago', days: 7 },
              ].map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleDatePreset(preset.days)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted/60 hover:bg-muted text-foreground transition-all shrink-0"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              
              {/* Date Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  Date of Sale *
                </label>
                <Input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="text-xs font-bold rounded-xl"
                  required
                />
              </div>

              {/* Time Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  Time (approx.)
                </label>
                <Input
                  type="time"
                  value={saleTime}
                  onChange={(e) => setSaleTime(e.target.value)}
                  className="text-xs font-bold rounded-xl"
                />
              </div>

              {/* Book / Ledger Reference */}
              <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                  Book / Ledger Ref
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Page 14, Entry #3"
                  value={bookReference}
                  onChange={(e) => setBookReference(e.target.value)}
                  className="text-xs rounded-xl"
                />
              </div>
            </div>

            {/* Customer Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Customer:
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-blue-600 h-10 cursor-pointer"
                >
                  <option value="">Walk-in Retail Customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Remarks / Book Notes:
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Sold during morning power cut"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="text-xs rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Items Sold (Search, Cart & Custom Items) */}
          <div className="p-5 sm:p-6 bg-card text-card-foreground border border-border rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2 font-bold text-base">
                <Package className="w-4 h-4 text-blue-600" />
                <span>2. Products Sold</span>
              </div>
              <span className="text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 px-2.5 py-0.5 rounded-full">
                {items.length} {items.length === 1 ? 'item' : 'items'} added
              </span>
            </div>

            {/* Search Catalog Input */}
            <div className="relative">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Search & Add Product from Catalog:
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Type product name, SKU, or barcode to add..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowProductDropdown(true);
                  }}
                  onFocus={() => setShowProductDropdown(true)}
                  className="pl-9 pr-24 rounded-xl text-xs h-10 bg-background"
                />
                <button
                  type="button"
                  onClick={() => setIsAddingCustom(true)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Custom Item
                </button>
              </div>

              {/* Product Autocomplete Dropdown */}
              {showProductDropdown && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-popover text-popover-foreground border border-border rounded-2xl shadow-xl max-h-60 overflow-y-auto divide-y divide-border/60">
                  <div className="p-2 bg-muted/40 text-[11px] font-bold text-muted-foreground flex justify-between items-center">
                    <span>Select product to add:</span>
                    <button 
                      type="button" 
                      onClick={() => setShowProductDropdown(false)}
                      className="text-xs hover:text-foreground"
                    >
                      Close ✕
                    </button>
                  </div>
                  {filteredProducts.map(p => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectProduct(p)}
                      className="p-3 hover:bg-muted/70 cursor-pointer flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <p className="font-bold text-foreground">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          SKU: {p.sku} {p.category?.name ? `• ${p.category.name}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">GH₵{Number(p.pricePerUnit).toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">Stock: {p.stockQuantity}</p>
                      </div>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="p-4 text-center text-xs text-muted-foreground space-y-2">
                      <p>No catalog product matches &ldquo;{productSearch}&rdquo;</p>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomItemName(productSearch);
                          setIsAddingCustom(true);
                          setShowProductDropdown(false);
                        }}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        + Add &ldquo;{productSearch}&rdquo; as a custom uncataloged item
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Custom Item Quick Form Drawer */}
            {isAddingCustom && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Add Custom / Uncataloged Item from Book
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setIsAddingCustom(false)}
                    className="text-xs text-muted-foreground hover:text-foreground font-bold"
                  >
                    Cancel ✕
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    type="text"
                    placeholder="Item description / name"
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    className="text-xs bg-background rounded-xl"
                  />
                  <Input
                    type="number"
                    min="1"
                    placeholder="Quantity"
                    value={customItemQty}
                    onChange={(e) => setCustomItemQty(parseInt(e.target.value) || 1)}
                    className="text-xs bg-background rounded-xl"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Unit Price (GH₵)"
                    value={customItemPrice}
                    onChange={(e) => setCustomItemPrice(e.target.value)}
                    className="text-xs bg-background rounded-xl"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={handleAddCustomItem}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs rounded-xl"
                  >
                    Add to Items
                  </Button>
                </div>
              </div>
            )}

            {/* Items Table */}
            <div className="border border-border rounded-2xl overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="w-32 text-center">Quantity</TableHead>
                    <TableHead className="w-32 text-right">Price (GH₵)</TableHead>
                    <TableHead className="w-32 text-right">Total</TableHead>
                    <TableHead className="w-12 text-center"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <p className="font-bold text-xs text-foreground">{item.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {item.sku || 'CUSTOM'}
                          </span>
                          {item.customName && (
                            <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                              Custom Item
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQtyChange(idx, -1)}
                            className="w-6 h-6 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="font-black text-xs min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQtyChange(idx, 1)}
                            className="w-6 h-6 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center font-bold text-xs"
                          >
                            +
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={item.priceAtSale}
                          onChange={(e) => handlePriceChange(idx, parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs text-right font-semibold rounded-lg w-24 ml-auto"
                        />
                      </TableCell>
                      <TableCell className="text-right font-black text-xs text-blue-600 dark:text-blue-400">
                        GH₵{(item.priceAtSale * item.quantity).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-muted-foreground hover:text-red-600 p-1 rounded transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-xs">
                        <div className="space-y-1">
                          <Package className="w-6 h-6 mx-auto opacity-30" />
                          <p className="font-semibold">No items added yet</p>
                          <p className="text-[11px]">Use the search bar above to add products from catalog or click &ldquo;Custom Item&rdquo;.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Right Column: Payment, Stock Controls & Final Review (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card 3: Payment & Inventory Controls */}
          <div className="p-5 sm:p-6 bg-card text-card-foreground border border-border rounded-3xl shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <span className="font-bold text-base flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                3. Payment & Stock
              </span>
              <span className="text-xs text-muted-foreground font-semibold">Step 3 of 3</span>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Payment Method:
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-blue-600 h-10 cursor-pointer"
              >
                <option value="CASH">Cash Payment</option>
                <option value="MOBILE_MONEY">Mobile Money (MTN / Telecel)</option>
                <option value="CARD">Bank Card / POS</option>
                <option value="CREDIT">Customer Credit / Book Debt</option>
                <option value="MULTIPLE">Split / Multiple Methods</option>
              </select>
            </div>

            {/* Discount & Paid Amount */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Discount (GH₵):
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="text-xs rounded-xl h-9"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Paid Amount:
                  </label>
                  <button
                    type="button"
                    onClick={() => setPaidAmount(totalAmount)}
                    className="text-[10px] text-blue-600 font-bold hover:underline"
                  >
                    Exact
                  </button>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  placeholder={totalAmount.toFixed(2)}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="text-xs rounded-xl h-9"
                />
              </div>
            </div>

            {/* Inventory Stock Deduction Settings */}
            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground">Deduct Inventory Stock</p>
                  <p className="text-[10px] text-muted-foreground">Reduce stock count for catalog items</p>
                </div>
                <input
                  type="checkbox"
                  checked={deductStock}
                  onChange={(e) => setDeductStock(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  aria-label="Deduct Inventory Stock"
                />
              </div>

              {deductStock && (
                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Allow Negative Stock</p>
                    <p className="text-[10px] text-muted-foreground">Prevent block if current stock is 0</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowNegativeStock}
                    onChange={(e) => setAllowNegativeStock(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    aria-label="Allow Negative Stock"
                  />
                </div>
              )}
            </div>

            {/* Financial Summary Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white space-y-2 shadow-md">
              <div className="flex justify-between text-xs text-blue-100">
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items):</span>
                <span>GH₵{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-xs text-emerald-200 font-semibold">
                  <span>Discount:</span>
                  <span>-GH₵{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-white/20 flex justify-between items-baseline">
                <span className="text-xs font-bold text-blue-100 uppercase tracking-wider">Total Sale Amount:</span>
                <span className="text-2xl font-black">GH₵{totalAmount.toFixed(2)}</span>
              </div>
              <div className="text-[10px] text-blue-200 flex items-center gap-1 pt-1">
                <Calendar className="w-3 h-3" />
                <span>Will be recorded for: <strong>{saleDate}</strong></span>
              </div>
            </div>

            {/* Submit Action Buttons */}
            <div className="space-y-2 pt-1">
              <Button
                type="button"
                disabled={isSubmitting || items.length === 0}
                onClick={() => handleSubmit(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all active:scale-[0.98]"
              >
                {isSubmitting ? 'Recording Sale...' : 'Save & Record Book Sale'}
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting || items.length === 0}
                onClick={() => handleSubmit(true)}
                className="w-full font-bold py-2 text-xs rounded-xl border-dashed hover:bg-muted"
                title="Preserves the date and book reference for rapid entry"
              >
                Save & Add Next from Book
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Book Sales Ledger Feed */}
      <div className="bg-card text-card-foreground border border-border rounded-3xl shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">Recently Captured Book Sales</h3>
              <p className="text-xs text-muted-foreground">Transactions imported from physical books & manual receipts</p>
            </div>
          </div>
          <span className="text-xs font-bold bg-muted px-2.5 py-1 rounded-full text-muted-foreground">
            {recentSales.length} recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Sale Date</TableHead>
                <TableHead>Book Reference</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSales.map((sale) => (
                <TableRow key={sale.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-xs font-bold">
                    <div className="flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-blue-600" />
                      <span>{sale.invoiceNo || sale.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-medium">
                    {new Date(sale.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[10px]">
                      {sale.note ? sale.note.replace('[Book Ref: ', '').replace(']', '') : 'Manual Entry'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold">
                      {sale.paymentMethod}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-black text-xs text-blue-600 dark:text-blue-400">
                    GH₵{Number(sale.totalAmount).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/receipt/${sale.id}`}
                      className="text-xs font-bold text-blue-600 hover:underline bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg"
                    >
                      Receipt
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {recentSales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                    No book sales captured yet. Fill out the form above to record your first book sale!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
