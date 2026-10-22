import { getWaybillSale } from '@/app/actions/deliveries';
import { getSettings } from '@/app/actions/system-settings';
import WaybillClient from './waybill-client';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function WaybillPage({ params }: { params: { id: string } }) {
  const sale = await getWaybillSale(params.id);

  if (!sale) return notFound();

  const settings = await getSettings();

  return <WaybillClient sale={sale} settings={settings} />;
}
