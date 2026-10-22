'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, Truck, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ReceiptClient({ sale, settings = {} }: { sale: any; settings?: Record<string, string> }) {
  const isQuotation = sale.status === 'QUOTATION';
  const businessName = settings.business_name || 'FRANCIS AMOAKO VENTURES';
  const currency = settings.currency || 'GH₵';

  const handlePrint = () => {
    try {
      window.print();
    } catch (err: any) {
      toast.error('Printer connection failed: ' + err.message);
    }
  };

  useEffect(() => {
    if (settings.auto_print_receipt === 'true') {
      const timer = setTimeout(() => {
        handlePrint();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [settings.auto_print_receipt]);

  const widthClass =
    settings.printer_width === '58mm'
      ? 'max-w-[58mm]'
      : settings.printer_width === '100%'
      ? 'max-w-full'
      : 'max-w-[80mm]';

  return (
    <div className="min-h-screen bg-muted flex flex-col items-center py-8 px-4 print:bg-white text-card-foreground print:py-0 print:px-0">
      
      {/* Controls (Hidden on print) */}
      <div className={`mb-6 flex flex-wrap gap-2 w-full ${widthClass} justify-between items-center print:hidden mx-auto`}>
        <Link href={isQuotation ? '/sales/quotations' : '/pos'}>
          <Button variant="outline" size="sm" className="bg-card text-card-foreground rounded-xl shadow-sm hover:bg-muted/50">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          {isQuotation && (
            <Link href={`/pos?resume=${sale.id}`}>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm font-bold text-xs gap-1">
                <ShoppingCart className="w-3.5 h-3.5" /> Convert in POS
              </Button>
            </Link>
          )}

          <Link href={`/waybill/${sale.id}`}>
            <Button variant="outline" size="sm" className="bg-card text-card-foreground rounded-xl shadow-sm hover:bg-muted/50 font-bold text-xs gap-1">
              <Truck className="w-3.5 h-3.5 text-blue-600" /> Waybill
            </Button>
          </Link>

          <Button onClick={handlePrint} size="sm" className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl shadow-md font-bold text-xs">
            <Printer className="w-3.5 h-3.5 mr-1" /> Print
          </Button>
        </div>
      </div>

      {/* Receipt Paper */}
      <div className={`bg-white p-6 w-full ${widthClass} shadow-2xl print:shadow-none print:w-full print:max-w-none font-mono text-sm leading-tight text-black border border-zinc-200 mx-auto`}>
        <div className="text-center mb-6">
          <h1 className="text-xl font-black mb-1 uppercase tracking-tight">{businessName}</h1>
          <p className="text-[11px] text-zinc-500 font-semibold uppercase">
            {isQuotation ? 'OFFICIAL PRO-FORMA INVOICE / ESTIMATE' : 'RETAIL & WHOLESALE CASH RECEIPT'}
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">Kumasi Central Market, Ghana</p>
          <p className="text-[10px] text-zinc-500">Tel: +233 (0) 24 000 0000</p>
        </div>

        <div className="flex justify-between text-xs mb-4 border-b border-dashed border-zinc-400 pb-3">
          <div>
            <p>Date: {new Date(sale.createdAt).toLocaleDateString('en-GB')}</p>
            <p>Time: {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div className="text-right">
            <p>{isQuotation ? 'Quote #' : 'Invoice #'}: {sale.invoiceNo || sale.id.slice(0, 8).toUpperCase()}</p>
            <p>Cashier: {sale.cashierId?.slice(0, 8) || 'Staff'}</p>
          </div>
        </div>

        {sale.customer && (
          <div className="mb-4 pb-2 border-b border-dashed border-zinc-300 text-xs">
            <span className="text-[10px] text-zinc-500 block uppercase font-bold">Customer / Client:</span>
            <p className="font-bold">{sale.customer.name}</p>
            {sale.customer.phone && <p className="text-[10px] text-zinc-500">Tel: {sale.customer.phone}</p>}
          </div>
        )}

        <div className="mb-4">
          <div className="flex justify-between font-bold border-b border-black pb-1 mb-2 text-xs">
            <span>ITEM</span>
            <span>TOTAL</span>
          </div>
          
          {sale.items.map((item: any) => (
            <div key={item.id} className="mb-2">
              <div className="flex justify-between">
                <span className="truncate pr-2 font-bold">{item.product?.name || 'Item'}</span>
                <span>{currency}{(Number(item.priceAtSale) * item.quantity).toFixed(2)}</span>
              </div>
              <div className="text-xs text-zinc-500">
                {item.quantity} x {currency}{Number(item.priceAtSale).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-black pt-2 mb-6 space-y-1">
          <div className="flex justify-between text-xs">
            <span>SUBTOTAL</span>
            <span>{currency}{(Number(sale.totalAmount) - Number(sale.taxAmount || 0)).toFixed(2)}</span>
          </div>
          {Number(sale.taxAmount) > 0 && (
            <div className="flex justify-between text-xs">
              <span>TAX</span>
              <span>{currency}{Number(sale.taxAmount).toFixed(2)}</span>
            </div>
          )}
          {Number(sale.discountAmount) > 0 && (
            <div className="flex justify-between text-xs text-emerald-700 font-bold">
              <span>DISCOUNT</span>
              <span>-{currency}{Number(sale.discountAmount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-black mt-2 pt-1 border-t border-dashed border-black">
            <span>TOTAL</span>
            <span>{currency}{Number(sale.totalAmount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs mt-2">
            <span>METHOD</span>
            <span className="bg-zinc-100 text-zinc-900 px-2 py-0.5 rounded uppercase font-bold">
              {isQuotation ? 'QUOTATION / PENDING' : sale.paymentMethod}
            </span>
          </div>
        </div>

        <div className="text-center text-xs space-y-2 pt-4 border-t border-dashed border-zinc-400">
          <p className="font-bold">
            {isQuotation ? 'PRO-FORMA INVOICE — VALID FOR 14 DAYS' : 'THANK YOU FOR YOUR BUSINESS!'}
          </p>
          <p className="text-[10px] text-zinc-500">
            {isQuotation
              ? 'Present this estimate at checkout to convert into a finalized delivery and receipt.'
              : 'Returns accepted within 30 days with original receipt.'}
          </p>
          <div className="w-full h-8 mt-4 border-t-4 border-b-4 border-black flex items-center justify-center opacity-40 space-x-1">
            {[...Array(24)].map((_, i) => (
              <div key={i} className={`h-full bg-black ${i % 3 === 0 ? 'w-1' : 'w-0.5'}`}></div>
            ))}
          </div>
          <p className="text-[8px] text-zinc-400 font-mono mt-1">{sale.id}</p>
        </div>
      </div>
    </div>
  );
}
