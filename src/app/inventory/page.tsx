import { getProducts } from '@/app/actions/inventory';
import InventoryClient from './inventory-client';
import InventoryAnalytics from './inventory-analytics';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const products = await getProducts();
  
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2 text-foreground">Inventory Manager</h1>
        <p className="text-muted-foreground text-lg">Manage your products, stock levels, and metadata.</p>
      </div>
      
      <InventoryAnalytics products={products} />
      
      <InventoryClient initialProducts={products} />
    </div>
  );
}
