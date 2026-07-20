import { getSales } from '@/app/actions/sales';
import { getProducts } from '@/app/actions/inventory';
import { Package, TrendingUp, DollarSign, Activity } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const sales = await getSales();
  const products = await getProducts();
  
  const todaySales = sales.filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString());
  const todayRevenue = todaySales.reduce((acc, sale) => acc + sale.totalAmount, 0);
  
  const lowStockItems = products.filter(p => p.stockQuantity <= p.minStockAlert);
  
  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground text-lg">Welcome back. Here's what's happening with your store today.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-card text-card-foreground rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-muted-foreground truncate">Today's Revenue</p>
              <h3 className="text-xl xl:text-2xl font-bold text-foreground truncate" title={`GH₵${todayRevenue.toFixed(2)}`}>GH₵{todayRevenue.toFixed(2)}</h3>
            </div>
          </div>
          <div className="text-sm text-emerald-600 font-medium flex items-center gap-1">
            <TrendingUp className="w-4 h-4" /> +12% from yesterday
          </div>
        </div>

        <div className="p-6 bg-card text-card-foreground rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-muted-foreground truncate">Today's Sales</p>
              <h3 className="text-xl xl:text-2xl font-bold text-foreground truncate" title={`${todaySales.length}`}>{todaySales.length}</h3>
            </div>
          </div>
          <Link href="/sales" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all sales &rarr;</Link>
        </div>

        <div className="p-6 bg-card text-card-foreground rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
              <Package className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-muted-foreground truncate">Low Stock Alerts</p>
              <h3 className="text-xl xl:text-2xl font-bold text-foreground truncate" title={`${lowStockItems.length}`}>{lowStockItems.length}</h3>
            </div>
          </div>
          <Link href="/inventory" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Manage inventory &rarr;</Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card text-card-foreground rounded-3xl border border-border shadow-sm p-6">
           <h3 className="text-xl font-bold mb-4">Recent Transactions</h3>
           <div className="space-y-4">
             {sales.slice(0, 5).map(sale => (
               <div key={sale.id} className="flex justify-between items-center p-4 bg-muted/50 rounded-xl border border-border">
                 <div>
                   <p className="font-medium">Receipt #{sale.id.slice(0, 8).toUpperCase()}</p>
                   <p className="text-sm text-muted-foreground">{new Date(sale.createdAt).toLocaleTimeString()}</p>
                 </div>
                 <p className="font-bold text-blue-600">GH₵{sale.totalAmount.toFixed(2)}</p>
               </div>
             ))}
             {sales.length === 0 && (
               <div className="text-center text-muted-foreground py-8">No transactions today.</div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
