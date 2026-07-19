import { getSale } from '@/app/actions/sales';
import ReceiptClient from './receipt-client';
import { notFound } from 'next/navigation';

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const sale = await getSale(params.id);
  
  if (!sale) return notFound();
  
  return <ReceiptClient sale={sale} />;
}
