import { prisma } from '@/lib/prisma';
import QuotationsClient from './quotations-client';

export const dynamic = 'force-dynamic';

export default async function QuotationsPage() {
  const quotations = await prisma.sale.findMany({
    where: { status: 'QUOTATION' },
    include: {
      items: {
        include: { product: true }
      },
      cashier: true,
      customer: {
        include: { group: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const serialized = quotations.map(q => ({
    ...q,
    totalAmount: Number(q.totalAmount),
    items: q.items.map(it => ({
      ...it,
      priceAtSale: Number(it.priceAtSale),
    }))
  }));

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-12">
      <QuotationsClient initialQuotations={serialized as any} />
    </div>
  );
}
