'use client';

import { useState } from 'react';
import { RefreshCcw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { processReturn } from '../actions/returns';

type SaleItem = {
  id: string;
  productId: string;
  quantity: number;
  priceAtSale: number;
  product: { name: string; sku: string };
};

type Sale = {
  id: string;
  invoiceNo: string;
  status: string;
  items: SaleItem[];
};

export function ReturnModal({ sale }: { sale: Sale }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  
  // State for which items are being returned
  const [returnItems, setReturnItems] = useState<{
    saleItemId: string;
    quantity: number;
    condition: 'GOOD' | 'DAMAGED';
    maxQuantity: number;
  }[]>(
    sale.items.map(item => ({
      saleItemId: item.id,
      quantity: 0, // initially 0 selected to return
      condition: 'GOOD',
      maxQuantity: item.quantity,
    }))
  );

  const handleQuantityChange = (saleItemId: string, qty: number, max: number) => {
    let newQty = qty;
    if (newQty < 0) newQty = 0;
    if (newQty > max) newQty = max;

    setReturnItems(prev =>
      prev.map(item =>
        item.saleItemId === saleItemId ? { ...item, quantity: newQty } : item
      )
    );
  };

  const handleConditionChange = (saleItemId: string, condition: 'GOOD' | 'DAMAGED') => {
    setReturnItems(prev =>
      prev.map(item =>
        item.saleItemId === saleItemId ? { ...item, condition } : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out items with 0 quantity
    const itemsToReturn = returnItems.filter(item => item.quantity > 0);
    
    if (itemsToReturn.length === 0) {
      toast.error('Please select at least one item to return');
      return;
    }

    setLoading(true);
    const res = await processReturn({
      saleId: sale.id,
      reason,
      items: itemsToReturn.map(i => ({
        saleItemId: i.saleItemId,
        quantity: i.quantity,
        condition: i.condition,
      })),
    });

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Return processed successfully!');
      setIsOpen(false);
      window.location.reload();
    }
    setLoading(false);
  };

  if (sale.status === 'REFUNDED') {
    return (
      <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-1 rounded-md border border-red-200">
        Refunded
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm font-medium text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors flex items-center gap-1.5"
      >
        <RefreshCcw className="w-3.5 h-3.5" />
        Process Return
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm text-left">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-xl border border-border p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center gap-3 mb-4 text-amber-600">
              <RefreshCcw className="w-6 h-6" />
              <h2 className="text-xl font-bold text-foreground">Process Return for {sale.invoiceNo}</h2>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4 break-words whitespace-normal">
              Select the items the customer is returning. Specify whether the item is in good condition (will be added back to stock) or damaged (will be written off).
            </p>

            <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto mb-4 border border-border rounded-xl">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground font-semibold sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3 text-center">Purchased</th>
                      <th className="px-4 py-3 text-center">Return Qty</th>
                      <th className="px-4 py-3">Condition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sale.items.map(item => {
                      const returnState = returnItems.find(ri => ri.saleItemId === item.id);
                      if (!returnState) return null;

                      return (
                        <tr key={item.id} className={returnState.quantity > 0 ? "bg-amber-50/50 dark:bg-amber-900/10" : ""}>
                          <td className="px-4 py-3 font-medium">
                            {item.product.name}
                            <div className="text-xs text-muted-foreground font-normal">GH₵{item.priceAtSale.toFixed(2)} each</div>
                          </td>
                          <td className="px-4 py-3 text-center text-muted-foreground font-medium">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max={item.quantity}
                              value={returnState.quantity || ''}
                              onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0, item.quantity)}
                              className="w-20 px-2 py-1 text-center bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={returnState.condition}
                              onChange={(e) => handleConditionChange(item.id, e.target.value as 'GOOD' | 'DAMAGED')}
                              disabled={returnState.quantity === 0}
                              className="w-full px-2 py-1.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                            >
                              <option value="GOOD">Good (Back to Stock)</option>
                              <option value="DAMAGED">Damaged (Write-off)</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="space-y-4 pt-2 border-t border-border mt-auto">
                <div>
                  <label className="block text-sm font-medium mb-1">Reason for Return (Optional)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="e.g. Customer changed mind, defective product"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                  />
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 p-3 rounded-xl flex items-start gap-3 border border-amber-200 dark:border-amber-800/30">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm break-words whitespace-normal flex-1">
                    Processing a return will deduct the refunded amount from today's total sales. "Good" items will be added back to inventory automatically. This action will be logged.
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 font-medium hover:bg-muted rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || returnItems.every(i => i.quantity === 0)}
                    className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Confirm Return'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
