'use client';

import { useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, ArrowUpRight } from 'lucide-react';

interface ChartProps {
  salesData: { date: string; sales: number; profit: number }[];
  categoryData: { name: string; value: number; color: string }[];
}

export function DashboardCharts({ salesData, categoryData }: ChartProps) {
  const [timeRange, setTimeRange] = useState<'30days' | '7days' | 'year'>('30days');

  // Filter or slice data based on selected range
  const displayData = timeRange === '7days' 
    ? salesData.slice(-7) 
    : salesData;

  const totalRangeSales = displayData.reduce((acc, d) => acc + d.sales, 0);
  const totalRangeProfit = displayData.reduce((acc, d) => acc + d.profit, 0);

  return (
    <div className="space-y-6">
      {/* Modern Main Chart Card */}
      <div className="p-6 md:p-8 bg-white/30 dark:bg-zinc-950/40 backdrop-blur-xl text-card-foreground rounded-3xl border border-border/50 shadow-lg shadow-black/5 relative overflow-hidden">
        {/* Header toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-foreground">Sales Performance & Revenue</h2>
            </div>
            <p className="text-sm text-muted-foreground">Real-time breakdown of gross revenue and net profit margins</p>
          </div>

          {/* Time range selector pills */}
          <div className="flex items-center bg-muted/60 p-1 rounded-2xl border border-border">
            {[
              { id: '7days', label: '7 Days' },
              { id: '30days', label: 'Last 30 Days' },
              { id: 'year', label: 'Financial Year' },
            ].map(pill => (
              <button
                key={pill.id}
                onClick={() => setTimeRange(pill.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                  timeRange === pill.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick summary banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Sales ({timeRange})</p>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400">GH₵{totalRangeSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs">
              +14.2%
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Net Margin ({timeRange})</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">GH₵{totalRangeProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
              +18.5%
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Average Daily Order</p>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400">GH₵{(totalRangeSales / (displayData.length || 1)).toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-xs">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Recharts Area Container */}
        <div className="h-[340px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.15)" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#888888', fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#888888', fontSize: 12 }} tickFormatter={(val) => `GH₵${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                  color: '#fff',
                  padding: '12px 16px'
                }}
                formatter={(value: any) => [`GH₵${Number(value).toFixed(2)}`, '']}
              />
              <Area type="monotone" dataKey="sales" name="Gross Revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              <Area type="monotone" dataKey="profit" name="Net Margin" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorProfit)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown Donut */}
        <div className="p-6 bg-white/30 dark:bg-zinc-950/40 backdrop-blur-xl text-card-foreground rounded-3xl border border-border/50 shadow-lg shadow-black/5 flex flex-col">
          <h3 className="text-lg font-bold mb-1">Sales by Category</h3>
          <p className="text-xs text-muted-foreground mb-6">Revenue share by product category</p>
          
          <div className="h-[220px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={6}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`GH₵${Number(value).toFixed(2)}`, 'Revenue']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 mt-4 pt-4 border-t border-border">
            {categoryData.map((cat, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></span>
                  <span className="font-semibold text-foreground">{cat.name}</span>
                </div>
                <span className="font-bold text-muted-foreground">GH₵{cat.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Revenue Bar Chart */}
        <div className="lg:col-span-2 p-6 bg-white/30 dark:bg-zinc-950/40 backdrop-blur-xl text-card-foreground rounded-3xl border border-border/50 shadow-lg shadow-black/5 flex flex-col">
          <h3 className="text-lg font-bold mb-1">Weekly Sales Distribution</h3>
          <p className="text-xs text-muted-foreground mb-6">Transaction volume by day of week</p>

          <div className="h-[240px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayData.slice(-7)} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.15)" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#888888', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#888888', fontSize: 12 }} tickFormatter={(val) => `GH₵${val}`} />
                <Tooltip formatter={(val: any) => [`GH₵${Number(val).toFixed(2)}`, 'Sales']} />
                <Bar dataKey="sales" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
