import { prisma } from '@/lib/prisma';
import PriceUpdateClient from './price-update-client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function PriceUpdatePage() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    redirect('/inventory'); // or throw new Error('Forbidden')
  }

  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto pb-12">
      <PriceUpdateClient initialProducts={products} />
    </div>
  );
}
