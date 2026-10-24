import { ShoppingCart, Trash2, Plus, Minus, Percent } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CartItem } from '@/types';

export function CartPanel({
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
  onBackToCatalog,
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
  onBackToCatalog?: () => void;
}) {
  return (
    <div className="w-full flex flex-col bg-card text-card-foreground rounded-3xl border border-border shadow-sm overflow-hidden">
      {/* Cart Header */}
      <div className="p-4 sm:p-5 border-b border-border bg-muted/40 flex justify-between items-center gap-2">
        <div className="flex items-center gap-2.5">
          {onBackToCatalog && (
            <button
              onClick={onBackToCatalog}
              className="lg:hidden p-2 rounded-xl bg-card border border-border text-foreground font-bold text-xs flex items-center gap-1 hover:bg-muted shadow-sm"
              title="Back to Product Catalog"
            >
              &larr;
            </button>
          )}
          <div className="p-2 bg-blue-600/10 text-blue-600 rounded-xl">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-foreground leading-none">Current Sale</h2>
            <span className="text-[10px] text-muted-foreground font-semibold lg:hidden">Review and Checkout</span>
          </div>
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
