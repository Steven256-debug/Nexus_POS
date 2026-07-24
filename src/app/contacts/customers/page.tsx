import { prisma } from '@/lib/prisma';
import CustomersClient from './customers-client';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    include: { group: true },
    orderBy: { name: 'asc' }
  });

  const groups = await prisma.customerGroup.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto pb-12">
      <CustomersClient initialCustomers={customers} groups={groups} />
    </div>
  );
}
