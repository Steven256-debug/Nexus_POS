'use client';

import { useState } from 'react';
import { Printer, Tag, Barcode } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LabelsClient({ products }: { products: any[] }) {
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [quantity, setQuantity] = useState(12);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center hide-on-print">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Barcode & Label Printer</h1>
          <p className="text-muted-foreground text-sm">Generate printable price tags and barcode sticker sheets.</p>
        </div>

        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2">
          <Printer className="w-4 h-4" /> Print Sticker Sheet
        </Button>
      </div>

      {/* Settings Bar */}
      <div className="p-6 bg-card rounded-3xl border border-border flex flex-col sm:flex-row gap-4 items-start sm:items-center hide-on-print">
        <div className="flex-1">
          <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Select Product</label>
          <select
            value={selectedProductId}
            onChange={e => setSelectedProductId(e.target.value)}
            className="w-full h-11 rounded-xl bg-card border border-border px-3 text-sm font-bold"
          >
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku}) - GH₵{p.pricePerUnit.toFixed(2)}</option>
            ))}
          </select>
        </div>

        <div className="w-40">
          <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Sticker Quantity</label>
          <input
            type="number"
            min="1"
            max="100"
            value={quantity}
            onChange={e => setQuantity(parseInt(e.target.value) || 1)}
            className="w-full h-11 rounded-xl bg-card border border-border px-3 text-sm font-bold text-center"
          />
        </div>
      </div>

      {/* Printable Sheet Grid */}
      <div className="p-8 bg-card rounded-3xl border border-border space-y-4">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider hide-on-print">Sticker Sheet Preview</h3>

        {selectedProduct ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: quantity }).map((_, idx) => (
              <div key={idx} className="p-4 bg-white text-zinc-950 rounded-xl border border-zinc-300 shadow-sm flex flex-col items-center justify-center text-center space-y-1.5 font-sans">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">FRANCIS AMOAKO VENTURES</p>
                <p className="text-xs font-black line-clamp-1">{selectedProduct.name}</p>
                <div className="font-mono text-xl tracking-widest font-black py-1 px-3 bg-zinc-100 rounded-md border border-zinc-200">
                  ||||| {selectedProduct.sku} |||||
                </div>
                <p className="text-sm font-black text-blue-600">GH₵{selectedProduct.pricePerUnit.toFixed(2)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-12 text-muted-foreground">Select a product to generate barcode stickers.</p>
        )}
      </div>
    </div>
  );
}
