import { getProducts } from '@/app/actions/inventory';
import { prisma } from '@/lib/prisma';
import { getSetting } from '@/app/actions/system-settings';
import PosClient from './pos-client';
import type { CartItem } from '@/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ resume?: string }>;
}

export default async function PosPage({ searchParams }: PageProps) {
  const products = await getProducts();
  const taxRateStr = await getSetting('tax_rate');
  
  const { resume } = await searchParams;
  const taxRate = taxRateStr ? parseFloat(taxRateStr) / 100 : 0.15;
  
  let resumedSaleId: string | null = null;
  let initialCart: CartItem[] = [];

  if (resume) {
    let sale = null;
    try {
      sale = await prisma.sale.findUnique({
        where: { id: resume },
        include: {
          items: {
            include: {
              product: {
                include: {
                  unit: true
                }
              }
            }
          }
        }
      });
    } catch (err) {
      console.error('Offline or DB Error resuming sale:', err);
    }

    if (sale && sale.status === 'DRAFT') {
      resumedSaleId = sale.id;
      initialCart = sale.items.map(item => ({
        id: item.product.id,
        name: item.product.name,
        sku: item.product.sku,
        unit: item.product.unit?.shortName || 'Pc(s)',
        price: Number(item.priceAtSale),
        quantity: item.quantity,
        maxStock: item.product.stockQuantity
      }));
    }
  }
  
  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col animate-in fade-in zoom-in-95 duration-500">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Point of Sale</h1>
          <p className="text-muted-foreground mt-1">
            {resumedSaleId ? `Resuming Draft Transaction #${resumedSaleId.slice(0, 8).toUpperCase()}` : 'Select items to add to the current transaction.'}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-100 font-medium text-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Register Active
        </div>
      </div>
      <PosClient initialProducts={products} initialResumedCart={initialCart} resumedSaleId={resumedSaleId} taxRate={taxRate} />
    </div>
  );
}
