import { prisma } from '@/lib/prisma';
import { PosListClient } from './pos-list-client';

export const dynamic = 'force-dynamic';

export default async function PosSalesPage() {
  const posSales = await prisma.sale.findMany({
    where: { 
      status: 'COMPLETED'
    },
    include: {
      items: {
        include: { product: true }
      },
      cashier: true,
      customer: true
    },
    orderBy: { createdAt: 'desc' },
    take: 500
  });

  return <PosListClient initialSales={posSales as any} />;
}

