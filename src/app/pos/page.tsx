import { getProducts } from '@/app/actions/inventory';
import PosClient from './pos-client';

export const dynamic = 'force-dynamic';

export default async function PosPage() {
  const products = await getProducts();
  
  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col animate-in fade-in zoom-in-95 duration-500">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-zinc-900 tracking-tight">Point of Sale</h1>
          <p className="text-zinc-500 mt-1">Select items to add to the current transaction.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-100 font-medium text-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Register Active
        </div>
      </div>
      <PosClient initialProducts={products} />
    </div>
  );
}
