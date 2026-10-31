import { getSales } from '@/app/actions/sales';
import { SalesClient } from './sales-client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function SalesPage() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role || 'EMPLOYEE';
  
  const sales = await getSales({ take: 500 });

  return <SalesClient initialSales={sales as any} userRole={userRole} />;
}

