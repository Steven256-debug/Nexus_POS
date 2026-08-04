import { prisma } from '@/lib/prisma';
import { BarChart3, Award } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const sales = await prisma.sale.findMany({
    where: { status: 'COMPLETED' },
    include: { items: { include: { product: true } } }
  });
  const expenses = await prisma.expense.findMany();

  const totalRevenue = sales.reduce((acc, s) => acc + Number(s.totalAmount), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount), 0);

  // Calculate real COGS from costAtSale or product.costPrice
  const totalCOGS = sales.reduce((acc, s) => {
    return acc + s.items.reduce((itemAcc: number, item: any) => {
      const costAtSale = Number(item.costAtSale ?? (item.product?.costPrice ?? 0));
      return itemAcc + (costAtSale * item.quantity);
    }, 0);
  }, 0);
  const grossProfit = totalRevenue - totalCOGS;
  const netProfit = grossProfit - totalExpenses;

  // Aggregate top selling products
  const productSalesMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  
  sales.forEach(sale => {
    sale.items.forEach(item => {
      const prod = item.product;
      if (prod) {
        const existing = productSalesMap.get(prod.id) || { name: prod.name, quantity: 0, revenue: 0 };
        existing.quantity += item.quantity;
        existing.revenue += (item.quantity * Number(item.priceAtSale));
        productSalesMap.set(prod.id, existing);
      }
    });
  });

  const topProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-foreground">Business & Sales Reports</h1>
        <p className="text-muted-foreground text-lg">Financial year analytics, profit & loss summary, and top products.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-card rounded-3xl border border-border shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Gross Sales Revenue</p>
          <p className="text-3xl font-black text-blue-600">GH₵{totalRevenue.toFixed(2)}</p>
        </div>

        <div className="p-6 bg-card rounded-3xl border border-border shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Operating Expenses</p>
          <p className="text-3xl font-black text-red-600">GH₵{totalExpenses.toFixed(2)}</p>
        </div>

        <div className="p-6 bg-card rounded-3xl border border-border shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Estimated Net Profit</p>
          <p className="text-3xl font-black text-emerald-600">GH₵{netProfit.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-card rounded-3xl border border-border space-y-4">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Top Selling Products</h3>
              <p className="text-xs text-muted-foreground">Highest volume items</p>
            </div>
          </div>
          
          <div className="space-y-3 pt-2">
            {topProducts.length > 0 ? topProducts.map((p, i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-muted/40 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </div>
                  <p className="font-bold text-sm">{p.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-foreground">{p.quantity} sold</p>
                  <p className="text-xs font-semibold text-blue-600">GH₵{p.revenue.toFixed(2)}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-6">No sales data available yet.</p>
            )}
          </div>
        </div>

        <div className="p-8 bg-card rounded-3xl border border-border text-center space-y-4 flex flex-col items-center justify-center min-h-[300px]">
          <BarChart3 className="w-16 h-16 text-blue-600 mx-auto opacity-20" />
          <div>
            <h3 className="text-xl font-bold">Detailed Financial Year Audit Reports</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-2">
              Comprehensive inventory auditing, tax reporting, and cashier register logs are automatically compiled at the end of each financial cycle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
