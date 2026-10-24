'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createProduct, getCategories } from '@/app/actions/inventory';
import { toast } from 'sonner';

const DEFAULT_BEVERAGE_CATEGORIES = [
  'Mineral & Bottled Water',
  'Sachet Water',
  'Carbonated Soft Drinks',
  'Energy Drinks',
  'Fruit Juices & Nectars',
  'Malt Drinks',
  'Flavored & Sparkling Drinks'
];

export default function AddProductPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoriesList, setCategoriesList] = useState<string[]>(DEFAULT_BEVERAGE_CATEGORIES);
  const [category, setCategory] = useState(DEFAULT_BEVERAGE_CATEGORIES[0]);
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [minStockAlert, setMinStockAlert] = useState('10');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getCategories()
      .then(cats => {
        if (cats && cats.length > 0) {
          const names = cats.map((c: any) => c.name);
          setCategoriesList(names);
          setCategory(names[0]);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku || !sellingPrice || !stockQuantity) {
      toast.error('Please fill in all required fields (Name, SKU, Price, Stock)');
      return;
    }

    const parsedPrice = parseFloat(sellingPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error('Selling price must be greater than 0');
      return;
    }

    const parsedStock = parseInt(stockQuantity);
    if (isNaN(parsedStock) || parsedStock < 0) {
      toast.error('Stock quantity cannot be negative');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createProduct({
        name,
        sku,
        barcode: barcode || null,
        category,
        pricePerUnit: parsedPrice,
        costPrice: parseFloat(costPrice || '0') || 0,
        stockQuantity: parsedStock,
        minStockAlert: parseInt(minStockAlert || '10') || 5,
        imageUrl: null,
      }, []);

      if (!res.success) {
        toast.error(res.error);
        return;
      }

      toast.success('Product created successfully');
      router.push('/inventory');
    } catch (err: any) {
      toast.error('Failed to create product: ' + (err.message || 'Server error'));
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
            <Input placeholder="e.g. Voltic Mineral Water 500ml (Pack of 16)" value={name} onChange={e => setName(e.target.value)} required className="rounded-xl h-11" />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">SKU Code *</label>
            <Input placeholder="e.g. WAT-VOL-500" value={sku} onChange={e => setSku(e.target.value)} required className="rounded-xl h-11" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Barcode (EAN/UPC)</label>
            <Input placeholder="e.g. 060012345001" value={barcode} onChange={e => setBarcode(e.target.value)} className="rounded-xl h-11" />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full h-11 rounded-xl bg-card border border-border px-3 text-sm font-medium">
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
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
