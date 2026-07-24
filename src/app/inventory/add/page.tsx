'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createProduct } from '@/app/actions/inventory';
import { toast } from 'sonner';

export default function AddProductPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('Aluzinc Sheets');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [minStockAlert, setMinStockAlert] = useState('10');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku || !sellingPrice || !stockQuantity) return;

    setIsSubmitting(true);
    try {
      await createProduct({
        name,
        sku,
        barcode: barcode || null,
        category,
        pricePerUnit: parseFloat(sellingPrice),
        costPrice: parseFloat(costPrice || '0'),
        stockQuantity: parseInt(stockQuantity),
        minStockAlert: parseInt(minStockAlert || '10'),
        imageUrl: null,
      }, []);

      toast.success('Product created successfully');
      router.push('/inventory');
    } catch (err: any) {
      toast.error('Failed to create product: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push('/inventory')} className="rounded-xl flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Inventory
        </Button>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Add New Product</h1>
          <p className="text-muted-foreground text-xs">Create a new item entry in the inventory master catalog.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 bg-card text-card-foreground rounded-3xl border border-border shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Product Name *</label>
            <Input placeholder="e.g. ALUZINC 0.50 WEST PRIME" value={name} onChange={e => setName(e.target.value)} required className="rounded-xl h-11" />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">SKU Code *</label>
            <Input placeholder="e.g. 1204" value={sku} onChange={e => setSku(e.target.value)} required className="rounded-xl h-11" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Barcode (EAN/UPC)</label>
            <Input placeholder="e.g. 89300001204" value={barcode} onChange={e => setBarcode(e.target.value)} className="rounded-xl h-11" />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full h-11 rounded-xl bg-card border border-border px-3 text-sm font-medium">
              <option value="Aluzinc Sheets">Aluzinc Sheets</option>
              <option value="Anti-Rust Sheets">Anti-Rust Sheets</option>
              <option value="Roofing Accessories">Roofing Accessories</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Selling Price (GH₵) *</label>
            <Input type="number" step="0.01" placeholder="0.00" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} required className="rounded-xl h-11 font-bold text-blue-600" />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Cost Price (GH₵)</label>
            <Input type="number" step="0.01" placeholder="0.00" value={costPrice} onChange={e => setCostPrice(e.target.value)} className="rounded-xl h-11 font-bold" />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Initial Stock Qty *</label>
            <Input type="number" placeholder="0" value={stockQuantity} onChange={e => setStockQuantity(e.target.value)} required className="rounded-xl h-11 font-bold" />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Min Stock Alert</label>
            <Input type="number" placeholder="10" value={minStockAlert} onChange={e => setMinStockAlert(e.target.value)} className="rounded-xl h-11 font-bold" />
          </div>
        </div>

        <div className="pt-4 border-t border-border flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.push('/inventory')}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-8 shadow-lg shadow-blue-500/20">
            {isSubmitting ? 'Saving...' : 'Create Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}
