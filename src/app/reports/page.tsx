import { prisma } from '@/lib/prisma';
import { ReportsClient } from './reports-client';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const [sales, expenses] = await Promise.all([
    prisma.sale.findMany({
      where: { status: 'COMPLETED' },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
      take: 1000
    }),
    prisma.expense.findMany({
      orderBy: { date: 'desc' },
      take: 1000
    }),
  ]);

  return <ReportsClient initialSales={sales as any} initialExpenses={expenses as any} />;
}

