import { getEmployeeDashboardData } from '@/app/actions/employee';
import { ShoppingCart, Clock, DollarSign, Package, ArrowRight, Activity, CalendarDays } from 'lucide-react';
import Link from 'next/link';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EmployeeDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }
  
  const employeeId = (session.user as any).id;
  const data = await getEmployeeDashboardData(employeeId);
  
  const { user, stats, recentSales } = data;

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">Employee Dashboard</h1>
        <p className="text-muted-foreground text-lg">Welcome back, {user?.email?.split('@')[0] || 'Employee'}. Here is your performance for today.</p>
      </div>

      {/* Personal Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-card text-card-foreground rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Your Revenue Today</p>
              <h3 className="text-2xl font-bold text-foreground">${stats.todayRevenue.toFixed(2)}</h3>
            </div>
          </div>
        </div>

        <div className="p-6 bg-card text-card-foreground rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Your Sales Today</p>
              <h3 className="text-2xl font-bold text-foreground">{stats.todaySalesCount}</h3>
            </div>
          </div>
        </div>

        <div className="p-6 bg-card text-card-foreground rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Items Sold Today</p>
              <h3 className="text-2xl font-bold text-foreground">{stats.totalItemsSold}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card text-card-foreground rounded-3xl border border-border shadow-sm p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Quick Actions
            </h3>
            
            <div className="space-y-4">
              <Link href="/pos" className="group flex items-center justify-between p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-6 h-6" />
                  <span className="font-bold text-lg">Open Register</span>
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <button disabled className="w-full group flex items-center justify-between p-4 bg-muted/50 text-muted-foreground border border-border rounded-2xl cursor-not-allowed">
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-6 h-6" />
                  <span className="font-medium text-lg">Clock In / Out</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider bg-zinc-200 px-2 py-1 rounded-md">Coming Soon</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-card text-card-foreground rounded-3xl border border-border shadow-sm p-6 h-full">
            <h3 className="text-xl font-bold mb-6">Your Recent Transactions</h3>
            <div className="space-y-4">
              {recentSales.map(sale => (
                <Link href={`/receipt/${sale.id}`} key={sale.id} className="block group">
                  <div className="flex justify-between items-center p-4 bg-muted/50 hover:bg-blue-50/50 rounded-xl border border-border transition-colors">
                    <div>
                      <p className="font-medium text-foreground group-hover:text-blue-700 transition-colors">Receipt #{sale.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        {new Date(sale.createdAt).toLocaleTimeString()}
                        <span>&bull;</span>
                        {sale.items.reduce((acc, item) => acc + item.quantity, 0)} items
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold text-foreground group-hover:text-blue-700">${sale.totalAmount.toFixed(2)}</p>
                      <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
              {recentSales.length === 0 && (
                <div className="text-center text-muted-foreground py-12 flex flex-col items-center">
                  <ShoppingCart className="w-12 h-12 text-zinc-200 mb-4" />
                  <p>You haven't processed any transactions yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
