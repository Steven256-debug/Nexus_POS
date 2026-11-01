import { prisma } from '@/lib/prisma';
import { getProducts } from '@/app/actions/inventory';
import { getRecentBookSales } from '@/app/actions/sales';
import { BookEntryClient } from './book-entry-client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function BookEntryPage() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role || 'EMPLOYEE';

  const [products, customers, recentBookSales] = await Promise.all([
    getProducts({ take: 500 }),
    prisma.customer.findMany({
      orderBy: { name: 'asc' },
      take: 200,
    }),
    getRecentBookSales(10),
  ]);

  return (
    <BookEntryClient
      products={products as any}
      customers={customers as any}
      recentBookSales={recentBookSales as any}
      userRole={userRole}
    />
  );
}
