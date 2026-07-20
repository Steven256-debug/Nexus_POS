'use client';

import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ReceiptClient({ sale }: { sale: any }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-muted flex flex-col items-center py-8 px-4 print:bg-card text-card-foreground print:py-0 print:px-0">
      
      {/* Controls (Hidden on print) */}
      <div className="mb-8 flex gap-4 w-full max-w-[80mm] justify-between print:hidden">
        <Link href="/pos">
          <Button variant="outline" className="bg-card text-card-foreground rounded-xl shadow-sm hover:bg-muted/50">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </Link>
        <Button onClick={handlePrint} className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl shadow-md">
          <Printer className="w-4 h-4 mr-2" /> Print
        </Button>
      </div>

      {/* Receipt Paper */}
      <div className="bg-white p-6 w-full max-w-[80mm] shadow-2xl print:shadow-none print:w-full print:max-w-none font-mono text-sm leading-tight text-black border border-zinc-200">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black mb-1">NEXUS POS</h1>
          <p className="text-xs text-zinc-500">123 Retail Ave, Commerce City</p>
          <p className="text-xs text-zinc-500">Phone: (555) 123-4567</p>
        </div>

        <div className="flex justify-between text-xs mb-6 border-b border-dashed border-zinc-400 pb-4">
          <div>
            <p>Date: {new Date(sale.createdAt).toLocaleDateString()}</p>
            <p>Time: {new Date(sale.createdAt).toLocaleTimeString()}</p>
          </div>
          <div className="text-right">
            <p>Receipt: #{sale.id.slice(0, 8).toUpperCase()}</p>
            <p>Cashier: {sale.cashierId.slice(0, 8)}</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between font-bold border-b border-black pb-1 mb-2">
            <span>ITEM</span>
            <span>TOTAL</span>
          </div>
          
          {sale.items.map((item: any) => (
            <div key={item.id} className="mb-2">
              <div className="flex justify-between">
                <span className="truncate pr-2">{item.product.name}</span>
                <span>GH₵{(item.priceAtSale * item.quantity).toFixed(2)}</span>
              </div>
              <div className="text-xs text-zinc-500">
                {item.quantity} x GH₵{item.priceAtSale.toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-black pt-2 mb-6 space-y-1">
          <div className="flex justify-between text-xs">
            <span>SUBTOTAL</span>
            <span>GH₵{(sale.totalAmount / 1.1).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>TAX (10%)</span>
            <span>GH₵{(sale.totalAmount - (sale.totalAmount / 1.1)).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-black mt-2">
            <span>TOTAL</span>
            <span>GH₵{sale.totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs mt-2">
            <span>METHOD</span>
            <span className="bg-zinc-100 text-zinc-900 px-2 py-0.5 rounded uppercase">{sale.paymentMethod}</span>
          </div>
        </div>

        <div className="text-center text-xs space-y-2 pt-4 border-t border-dashed border-zinc-400">
          <p className="font-bold">THANK YOU FOR YOUR BUSINESS!</p>
          <p className="text-zinc-500">Returns accepted within 30 days with original receipt.</p>
          <div className="w-full h-12 mt-4 border-t-8 border-b-8 border-black flex items-center justify-center opacity-50 space-x-1">
            {[...Array(20)].map((_, i) => (
              <div key={i} className={`h-full bg-black ${Math.random() > 0.5 ? 'w-1' : 'w-0.5'}`}></div>
            ))}
          </div>
          <p className="text-[8px] text-zinc-400">{sale.id}</p>
        </div>
      </div>
    </div>
  );
}
