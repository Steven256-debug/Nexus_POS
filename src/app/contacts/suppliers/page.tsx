import { prisma } from '@/lib/prisma';
import SuppliersClient from './suppliers-client';

export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto pb-12">
      <SuppliersClient initialSuppliers={suppliers} />
    </div>
  );
}
