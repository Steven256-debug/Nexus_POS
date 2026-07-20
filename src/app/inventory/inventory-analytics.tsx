import { Activity, DollarSign, Package, AlertTriangle } from 'lucide-react';

export default function InventoryAnalytics({ products }: { products: any[] }) {
  const totalValue = products.reduce((acc, p) => acc + (p.pricePerUnit * p.stockQuantity), 0);
  const totalItems = products.length;
  const outOfStock = products.filter(p => p.stockQuantity <= 0).length;
  const lowStock = products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.minStockAlert).length;
  const healthy = totalItems - outOfStock - lowStock;

  const healthyPct = totalItems > 0 ? (healthy / totalItems) * 100 : 0;
  const lowPct = totalItems > 0 ? (lowStock / totalItems) * 100 : 0;
  const outPct = totalItems > 0 ? (outOfStock / totalItems) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="p-6 bg-card text-card-foreground rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Inventory Value</p>
            <h3 className="text-2xl font-bold text-foreground">GH₵{totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
        </div>
      </div>

      <div className="p-6 bg-card text-card-foreground rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Unique Products</p>
            <h3 className="text-2xl font-bold text-foreground">{totalItems}</h3>
          </div>
        </div>
      </div>

      <div className="p-6 bg-card text-card-foreground rounded-2xl border border-border shadow-sm lg:col-span-2">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Stock Health Status</p>
            <div className="flex gap-4 text-sm mt-1 font-medium">
              <span className="text-emerald-600">{healthy} Healthy</span>
              <span className="text-amber-500">{lowStock} Low</span>
              <span className="text-red-500">{outOfStock} Out</span>
            </div>
          </div>
        </div>
        
        {totalItems > 0 ? (
          <div className="h-4 w-full bg-muted rounded-full flex overflow-hidden">
            <div style={{ width: `${healthyPct}%` }} className="bg-emerald-500 transition-all duration-500" title="Healthy"></div>
            <div style={{ width: `${lowPct}%` }} className="bg-amber-400 transition-all duration-500" title="Low Stock"></div>
            <div style={{ width: `${outPct}%` }} className="bg-red-500 transition-all duration-500" title="Out of Stock"></div>
          </div>
        ) : (
          <div className="h-4 w-full bg-muted rounded-full"></div>
        )}
      </div>
    </div>
  );
}
