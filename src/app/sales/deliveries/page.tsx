import { getDeliveries } from '@/app/actions/deliveries';
import DeliveriesClient from './deliveries-client';

export const dynamic = 'force-dynamic';

export default async function DeliveriesPage() {
  const deliveries = await getDeliveries();

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-12">
      <DeliveriesClient initialSales={deliveries as any} />
    </div>
  );
}
