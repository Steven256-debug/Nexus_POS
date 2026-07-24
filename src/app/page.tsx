import { getDashboardMetrics } from '@/app/actions/dashboard';
import { Package, TrendingUp, DollarSign, Activity, AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { AutoSizeText } from '@/components/auto-size-text';
import { DashboardCharts } from './dashboard-charts';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  const userName = session?.user?.name || session?.user?.email || 'User';

  const {
    todayRevenue,
    todaySalesCount,
    revenueGrowth,
    totalProducts,
    lowStockCount,
    lowStockProducts,
    days30,
    recentSales
  } = await getDashboardMetrics();

  // Category dummy distribution for chart display
  const categoryData = [
    { name: 'Aluzinc Sheets', value: 45, color: '#2563eb' },
    { name: 'Anti-Rust Sheets', value: 30, color: '#10b981' },
    { name: 'Roofing Accessories', value: 25, color: '#f59e0b' },
  ];

  return (
    <div className="relative min-h-full">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-12">
        {/* Blue Hero Welcome Banner */}
        <div className="p-8 md:p-10 rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-600/15 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="space-y-2 z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-md border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Branch: FRANCIS AMOAKO VENTURES (BL0001)
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight flex items-center gap-3">
              Welcome {userName}, 👋
            </h1>
            <p className="text-blue-100 text-base md:text-lg max-w-2xl font-medium">
              Here is your live enterprise inventory & point-of-sale overview today.
            </p>
          </div>

          <div className="z-10 flex gap-3">
            <Link href="/pos" className="px-6 py-3.5 bg-white text-blue-700 font-bold rounded-2xl shadow-lg hover:bg-blue-50 transition-transform active:scale-95 text-sm flex items-center gap-2">
              Open POS Terminal &rarr;
            </Link>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white/30 dark:bg-zinc-950/40 backdrop-blur-xl text-card-foreground rounded-3xl border border-border/50 shadow-lg shadow-black/5">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">Today's Revenue</p>
                <AutoSizeText className="text-xl xl:text-2xl font-black text-foreground">GH₵{todayRevenue.toFixed(2)}</AutoSizeText>
              </div>
            </div>
            <div className="text-xs text-emerald-600 font-bold flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}% from yesterday
            </div>
          </div>

          <div className="p-6 bg-white/30 dark:bg-zinc-950/40 backdrop-blur-xl text-card-foreground rounded-3xl border border-border/50 shadow-lg shadow-black/5">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
                <Activity className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">Today's Transactions</p>
                <AutoSizeText className="text-xl xl:text-2xl font-black text-foreground">{todaySalesCount}</AutoSizeText>
              </div>
            </div>
            <Link href="/sales" className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1">
              View all sales <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="p-6 bg-white/30 dark:bg-zinc-950/40 backdrop-blur-xl text-card-foreground rounded-3xl border border-border/50 shadow-lg shadow-black/5">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
                <Package className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">Active Products</p>
                <AutoSizeText className="text-xl xl:text-2xl font-black text-foreground">{totalProducts}</AutoSizeText>
              </div>
            </div>
            <Link href="/inventory" className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1">
              Manage product catalog <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="p-6 bg-white/30 dark:bg-zinc-950/40 backdrop-blur-xl text-card-foreground rounded-3xl border border-border/50 shadow-lg shadow-black/5">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-500/10 text-red-600 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">Low Stock Alerts</p>
                <AutoSizeText className="text-xl xl:text-2xl font-black text-foreground">{lowStockCount}</AutoSizeText>
              </div>
            </div>
            <Link href="/inventory" className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1">
              Reorder low stock items <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Modern Interactive Charts Section */}
        <DashboardCharts salesData={days30} categoryData={categoryData} />

        {/* Recent Transactions & Stock Alerts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Transactions */}
          <div className="bg-white/30 dark:bg-zinc-950/40 backdrop-blur-xl text-card-foreground rounded-3xl border border-border/50 shadow-lg shadow-black/5 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-foreground">Recent Transactions</h3>
              <Link href="/sales" className="text-xs font-bold text-blue-600 hover:underline">View All</Link>
            </div>
            <div className="space-y-3">
              {recentSales.map(sale => (
                <div key={sale.id} className="flex justify-between items-center p-4 bg-muted/40 rounded-2xl border border-border/60 hover:bg-muted/70 transition-colors">
                  <div>
                    <p className="font-bold text-sm text-foreground">Invoice #{sale.invoiceNo || sale.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">{new Date(sale.createdAt).toLocaleTimeString()} • {sale.paymentMethod}</p>
                  </div>
                  <span className="font-black text-base text-blue-600 dark:text-blue-400">GH₵{sale.totalAmount.toFixed(2)}</span>
                </div>
              ))}
              {recentSales.length === 0 && (
                <div className="text-center text-muted-foreground py-10">No recent transactions recorded today.</div>
              )}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white/30 dark:bg-zinc-950/40 backdrop-blur-xl text-card-foreground rounded-3xl border border-border/50 shadow-lg shadow-black/5 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" /> Stock Level Alerts
              </h3>
              <Link href="/inventory" className="text-xs font-bold text-blue-600 hover:underline">Manage Stock</Link>
            </div>
            <div className="space-y-3">
              {lowStockProducts.map(p => (
                <div key={p.id} className="flex justify-between items-center p-4 bg-amber-500/5 rounded-2xl border border-amber-500/20">
                  <div>
                    <p className="font-bold text-sm text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">SKU: {p.sku}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs">
                      {p.stockQuantity} Pc(s) left
                    </span>
                  </div>
                </div>
              ))}
              {lowStockProducts.length === 0 && (
                <div className="text-center text-muted-foreground py-10">All stock levels are optimal!</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
