import { prisma } from '@/lib/prisma';
import LabelsClient from './labels-client';

export const dynamic = 'force-dynamic';

export default async function LabelsPage() {
  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto pb-12">
      <LabelsClient products={products} />
    </div>
  );
}
