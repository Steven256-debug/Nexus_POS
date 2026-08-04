'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createProduct } from '@/app/actions/inventory';
import { Package } from 'lucide-react';
import { toast } from 'sonner';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: () => void;
}

export function AddProductModal({ isOpen, onClose, onProductAdded }: ModalProps) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('Aluzinc Sheets');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku || !price || !stock) return;

    setIsSubmitting(true);
    try {
      await createProduct({
        name,
        sku,
        category,
        pricePerUnit: parseFloat(price),
        costPrice: parseFloat(costPrice || '0'),
        stockQuantity: parseInt(stock),
        minStockAlert: 10,
        imageUrl: null,
      }, []);

      onProductAdded();
      onClose();
      setName('');
      setSku('');
      setPrice('');
      setCostPrice('');
      setStock('');
    } catch (err: any) {
      toast.error('Failed to add product: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" /> Quick Add Product
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Product Name *</label>
            <Input
              placeholder="e.g. ALUZINC 0.50 PRIME"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="rounded-xl h-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">SKU / Code *</label>
              <Input
                placeholder="e.g. 1250"
                value={sku}
                onChange={e => setSku(e.target.value)}
                required
                className="rounded-xl h-11"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Category</label>
              <Input
                placeholder="Category"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="rounded-xl h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Selling Price *</label>
              <Input
                type="number"
                step="0.01"
                placeholder="GH₵"
                value={price}
                onChange={e => setPrice(e.target.value)}
                required
                className="rounded-xl h-11 font-bold text-blue-600"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Cost Price</label>
              <Input
                type="number"
                step="0.01"
                placeholder="GH₵"
                value={costPrice}
                onChange={e => setCostPrice(e.target.value)}
                className="rounded-xl h-11"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Initial Stock *</label>
              <Input
                type="number"
                placeholder="Qty"
                value={stock}
                onChange={e => setStock(e.target.value)}
                required
                className="rounded-xl h-11 font-bold"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Add to Catalog'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
