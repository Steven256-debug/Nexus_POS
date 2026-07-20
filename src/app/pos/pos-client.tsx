'use client';

import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, Smartphone, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { processSale } from '@/app/actions/sales';
import { useRouter } from 'next/navigation';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  maxStock: number;
}

export default function PosClient({ initialProducts }: { initialProducts: any[] }) {
  const router = useRouter();
  const [products] = useState(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('pos_cart');
    if (saved) {
      try {
        const parsedCart = JSON.parse(saved) as CartItem[];
        const validatedCart = parsedCart.map(item => {
          const currentProduct = products.find(p => p.id === item.id);
          if (!currentProduct) return null;
          return {
            ...item,
            price: currentProduct.pricePerUnit,
            maxStock: currentProduct.stockQuantity,
            quantity: Math.min(item.quantity, currentProduct.stockQuantity)
          };
        }).filter(Boolean) as CartItem[];
        setCart(validatedCart.filter(item => item.quantity > 0));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, [products]);

  useEffect(() => {
    if (isMounted) localStorage.setItem('pos_cart', JSON.stringify(cart));
  }, [cart, isMounted]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) return prev;
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      if (product.stockQuantity <= 0) return prev;
      return [...prev, { id: product.id, name: product.name, price: product.pricePerUnit, quantity: 1, maxStock: product.stockQuantity }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta;
        if (newQ > 0 && newQ <= item.maxStock) return { ...item, quantity: newQ };
        if (newQ <= 0) return item; 
      }
      return item;
    }));
  };

  const setExactQuantity = (id: string, qty: number) => {
    if (isNaN(qty)) return;
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const validQty = Math.max(1, Math.min(qty, item.maxStock));
        return { ...item, quantity: validQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.10; // 10% tax
  const total = subtotal + tax;

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      const sale = await processSale(
        'dummy-cashier-id',
        paymentMethod,
        cart.map(item => ({ productId: item.id, quantity: item.quantity, priceAtSale: item.price }))
      );
      setCart([]);
      setIsCheckoutOpen(false);
      router.push(`/receipt/${sale.id}`);
    } catch (err) {
      alert("Checkout failed: " + err);
    } finally {
      setIsProcessing(false);
    }
  };

  const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category)))];

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[600px] relative">
      <div className="flex-1 flex flex-col bg-card text-card-foreground rounded-3xl shadow-sm border border-border overflow-hidden relative pb-20 lg:pb-0">
        <div className="p-5 border-b border-border flex flex-col gap-4 bg-muted/50/80 backdrop-blur-md z-10">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <Input 
              placeholder="Search products by name or SKU..." 
              className="pl-12 h-14 text-lg rounded-2xl bg-card text-card-foreground shadow-sm border-border focus-visible:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-6 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                  categoryFilter === cat 
                    ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-900/20 scale-105' 
                    : 'bg-card text-card-foreground border border-border text-muted-foreground hover:bg-muted/50 hover:border-zinc-300'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-muted/50/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredProducts.map(product => {
              const inCart = cart.find(c => c.id === product.id)?.quantity || 0;
              const available = product.stockQuantity - inCart;
              const isOutOfStock = available <= 0;

              return (
                <div 
                  key={product.id} 
                  onClick={() => !isOutOfStock && addToCart(product)}
                  className={`relative flex flex-col p-5 rounded-2xl border transition-all duration-300 ${
                    isOutOfStock 
                      ? 'border-red-100 bg-red-50/50 opacity-60 cursor-not-allowed grayscale-[50%]' 
                      : 'border-border bg-card text-card-foreground hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer active:scale-[0.98]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-mono font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">{product.sku}</span>
                    <span className="font-bold text-xl text-blue-600">${product.pricePerUnit.toFixed(2)}</span>
                  </div>
                  {product.imageUrl && (
                    <div className="mb-4 -mx-1 -mt-2 rounded-xl overflow-hidden h-32 bg-muted flex items-center justify-center">
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <h3 className="font-semibold text-foreground leading-tight mb-4 flex-1 text-lg">{product.name}</h3>
                  <div className="flex justify-between items-center mt-auto pt-4 border-t border-border">
                    <Badge variant={isOutOfStock ? "destructive" : "secondary"} className={isOutOfStock ? "bg-red-100 text-red-700" : "bg-emerald-50 text-emerald-700"}>
                      {isOutOfStock ? 'Out of Stock' : `${available} in stock`}
                    </Badge>
                  </div>
                </div>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-zinc-400">
                <Search className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-lg">No products found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Cart Button */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-20 left-4 right-4 z-40 pb-safe">
          <Button 
            onClick={() => setIsMobileCartOpen(true)} 
            className="w-full h-14 rounded-2xl shadow-xl shadow-blue-500/30 bg-blue-600 hover:bg-blue-700 text-white flex justify-between items-center px-6 transition-transform active:scale-95"
          >
            <span className="font-bold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" /> 
              View Cart ({cart.length})
            </span>
            <span className="font-bold bg-background/20 text-foreground px-3 py-1.5 rounded-lg border border-white/10 shadow-inner">
              ${total.toFixed(2)}
            </span>
          </Button>
        </div>
      )}

      {/* Cart Section */}
      <div className={`
        ${isMobileCartOpen ? 'fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-sm flex flex-col justify-end' : 'hidden lg:flex'} 
        lg:relative lg:w-[420px] lg:h-auto transition-opacity duration-300
      `}>
        {isMobileCartOpen && (
          <div className="absolute inset-0 z-0" onClick={() => setIsMobileCartOpen(false)} />
        )}
        <div className={`
          bg-card text-card-foreground flex flex-col shadow-2xl relative z-10 transition-transform duration-300 transform
          ${isMobileCartOpen ? 'h-[85vh] rounded-t-3xl translate-y-0' : 'rounded-3xl h-full border border-border'}
        `}>
          <div className={`p-6 border-b border-border bg-zinc-950 text-white flex justify-between items-center ${isMobileCartOpen ? 'rounded-t-3xl' : ''}`}>
            <h2 className="text-xl font-bold flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-blue-400" />
              </div>
              Current Sale
            </h2>
            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button 
                  onClick={() => {
                    if (confirm('Are you sure you want to clear the cart?')) {
                      setCart([]);
                      setIsMobileCartOpen(false);
                    }
                  }}
                  className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                  title="Clear Cart"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {isMobileCartOpen ? (
                <button onClick={() => setIsMobileCartOpen(false)} className="p-1.5 text-zinc-400 hover:text-white rounded-md bg-zinc-800 ml-2">
                  <X className="w-5 h-5" />
                </button>
              ) : (
                <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700">{cart.length} items</Badge>
              )}
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 bg-muted/50/50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-4">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                <ShoppingCart className="w-10 h-10 text-zinc-300" />
              </div>
              <p className="font-medium text-muted-foreground">Your cart is empty</p>
              <p className="text-sm text-zinc-400">Select products to add them here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex flex-col p-4 bg-card text-card-foreground rounded-2xl border border-border shadow-sm gap-3 group">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className="font-semibold text-foreground leading-tight">{item.name}</h4>
                    <span className="font-bold text-blue-600 whitespace-nowrap">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 bg-muted/50 border border-border rounded-xl p-1">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-2 hover:bg-card text-card-foreground rounded-lg transition-colors shadow-sm" disabled={item.quantity <= 1}>
                        <Minus className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <input 
                        type="number"
                        min="1"
                        max={item.maxStock}
                        value={item.quantity || ''}
                        onChange={(e) => setExactQuantity(item.id, parseInt(e.target.value))}
                        className="w-12 text-center font-bold text-foreground bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-2 hover:bg-card text-card-foreground rounded-lg transition-colors shadow-sm" disabled={item.quantity >= item.maxStock}>
                        <Plus className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 bg-card text-card-foreground border-t border-border shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] z-10">
          <div className="space-y-3 text-sm mb-6">
            <div className="flex justify-between text-muted-foreground font-medium">
              <span>Subtotal</span>
              <span className="text-foreground">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground font-medium">
              <span>Tax (10%)</span>
              <span className="text-foreground">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-end pt-4 border-t border-dashed border-border">
              <span className="text-lg font-bold text-foreground">Total</span>
              <span className="text-4xl font-black text-blue-600 tracking-tight">${total.toFixed(2)}</span>
            </div>
          </div>
          <Button 
            className="w-full h-16 text-xl font-bold rounded-2xl shadow-xl shadow-blue-600/20 bg-blue-600 hover:bg-blue-700 transition-all active:scale-[0.98]" 
            disabled={cart.length === 0}
            onClick={() => setIsCheckoutOpen(true)}
          >
            Checkout
          </Button>
        </div>
      </div>
      </div>

      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-md rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black text-center mb-2">Payment</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <div className="text-center mb-10 p-6 bg-muted/50 rounded-2xl border border-border">
              <p className="text-muted-foreground text-sm font-semibold uppercase tracking-wider mb-2">Amount Due</p>
              <p className="text-6xl font-black text-blue-600 tracking-tighter">${total.toFixed(2)}</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <button 
                onClick={() => setPaymentMethod('CASH')}
                className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all duration-200 ${paymentMethod === 'CASH' ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md scale-105' : 'border-border hover:border-blue-300 text-muted-foreground hover:bg-muted/50'}`}
              >
                <Banknote className="w-8 h-8 mb-3" />
                <span className="text-sm font-bold">Cash</span>
              </button>
              <button 
                onClick={() => setPaymentMethod('CARD')}
                className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all duration-200 ${paymentMethod === 'CARD' ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md scale-105' : 'border-border hover:border-blue-300 text-muted-foreground hover:bg-muted/50'}`}
              >
                <CreditCard className="w-8 h-8 mb-3" />
                <span className="text-sm font-bold">Card</span>
              </button>
              <button 
                onClick={() => setPaymentMethod('MOBILE_MONEY')}
                className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all duration-200 ${paymentMethod === 'MOBILE_MONEY' ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md scale-105' : 'border-border hover:border-blue-300 text-muted-foreground hover:bg-muted/50'}`}
              >
                <Smartphone className="w-8 h-8 mb-3" />
                <span className="text-sm font-bold">Mobile</span>
              </button>
            </div>
          </div>
          <DialogFooter className="gap-3 sm:gap-0 mt-4">
            <Button variant="ghost" className="h-14 w-full rounded-xl text-muted-foreground font-semibold" onClick={() => setIsCheckoutOpen(false)}>Cancel</Button>
            <Button className="h-14 w-full rounded-xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20 text-lg font-bold" onClick={handleCheckout} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Confirm Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
