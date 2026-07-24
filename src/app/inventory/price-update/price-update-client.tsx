'use client';

import { useState } from 'react';
import { Tag, Save, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { updateProduct } from '@/app/actions/inventory';

export default function PriceUpdateClient({ initialProducts }: { initialProducts: any[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handlePriceChange = (id: string, newPrice: string) => {
    const val = parseFloat(newPrice);
    if (!isNaN(val)) {
      setPrices(prev => ({ ...prev, [id]: val }));
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      for (const id of Object.keys(prices)) {
        const prod = products.find(p => p.id === id);
        if (prod) {
          await updateProduct(id, { ...prod, pricePerUnit: prices[id] }, []);
        }
      }
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      alert('Error updating prices');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Batch Price Update</h1>
          <p className="text-muted-foreground text-sm">Update selling prices across inventory items in bulk.</p>
        </div>

        <Button
          onClick={handleSaveAll}
          disabled={Object.keys(prices).length === 0 || isSaving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          <Save className="w-4 h-4" /> {isSaving ? 'Saving Changes...' : 'Save All Price Changes'}
        </Button>
      </div>

      {isSaved && (
        <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-2xl border border-emerald-500/20 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold text-sm">Product prices updated successfully!</span>
        </div>
      )}

      <div className="bg-card text-card-foreground rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/60 text-muted-foreground font-bold uppercase text-xs border-b border-border">
              <tr>
                <th className="p-4">SKU</th>
                <th className="p-4">Product Name</th>
                <th className="p-4 text-right">Current Price (GH₵)</th>
                <th className="p-4 text-right">New Selling Price (GH₵)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                  <td className="p-4 font-mono font-bold text-xs text-muted-foreground">{p.sku}</td>
                  <td className="p-4 font-bold text-foreground">{p.name}</td>
                  <td className="p-4 text-right font-semibold text-muted-foreground">GH₵{p.pricePerUnit.toFixed(2)}</td>
                  <td className="p-4 text-right">
                    <Input
                      type="number"
                      step="0.01"
                      defaultValue={p.pricePerUnit}
                      onChange={e => handlePriceChange(p.id, e.target.value)}
                      className="w-32 ml-auto text-right font-black text-blue-600 rounded-xl h-10"
                    />
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">No products in inventory catalog.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
