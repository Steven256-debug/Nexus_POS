'use client';

import { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Award, 
  Calendar, 
  CalendarDays, 
  DollarSign, 
  TrendingUp, 
  ArrowDownRight, 
  ArrowUpRight, 
  RotateCcw, 
  Printer, 
  Sparkles,
  ChevronDown,
  Percent,
  CheckCircle2,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SaleItem {
  quantity: number;
  priceAtSale: number;
  costAtSale?: number;
  product?: {
    id: string;
    name: string;
    costPrice?: number;
  } | null;
}

interface Sale {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string | Date;
  items: SaleItem[];
}

interface Expense {
  id: string;
  amount: number;
  category?: string;
  note?: string | null;
  date: string | Date;
}

interface ReportsClientProps {
  initialSales: Sale[];
  initialExpenses: Expense[];
}

function toLocalDateString(dateInput: string | Date): string {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  return dateObj.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function ReportsClient({ initialSales, initialExpenses }: ReportsClientProps) {
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');

  // Compute active dates with recorded sales
  const datesWithSales = useMemo(() => {
    const map = new Map<string, { date: string; displayDate: string; count: number; revenue: number }>();
    initialSales.forEach(sale => {
      const dateStr = toLocalDateString(sale.createdAt);
      const existing = map.get(dateStr) || {
        date: dateStr,
        displayDate: formatDisplayDate(dateStr),
        count: 0,
        revenue: 0
      };
      existing.count += 1;
      existing.revenue += Number(sale.totalAmount);
      map.set(dateStr, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [initialSales]);

  // Handle Preset Select
  const handlePresetSelect = (preset: 'all' | 'today' | 'yesterday' | 'week' | 'month') => {
    setDatePreset(preset);
    const today = new Date();
    
    if (preset === 'all') {
      setSelectedDate('');
    } else if (preset === 'today') {
      setSelectedDate(toLocalDateString(today));
    } else if (preset === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      setSelectedDate(toLocalDateString(yesterday));
    } else if (preset === 'week' || preset === 'month') {
      setSelectedDate('');
    }
  };

  const handleCustomDateChange = (val: string) => {
    setSelectedDate(val);
    setDatePreset(val ? 'custom' : 'all');
  };

  const handleClearFilters = () => {
    setSelectedDate('');
    setDatePreset('all');
  };

  // Filter Sales & Expenses
  const { filteredSales, filteredExpenses } = useMemo(() => {
    const todayStr = toLocalDateString(new Date());
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const matchesDate = (itemDate: string | Date) => {
      const dateStr = toLocalDateString(itemDate);
      const dateObj = new Date(itemDate);

      if (selectedDate) {
        return dateStr === selectedDate;
      }
      if (datePreset === 'today') {
        return dateStr === todayStr;
      }
      if (datePreset === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return dateStr === toLocalDateString(yesterday);
      }
      if (datePreset === 'week') {
        return dateObj >= sevenDaysAgo;
      }
      if (datePreset === 'month') {
        return dateObj.getFullYear() === currentYear && dateObj.getMonth() === currentMonth;
      }
      return true; // 'all'
    };

    return {
      filteredSales: initialSales.filter(s => matchesDate(s.createdAt)),
      filteredExpenses: initialExpenses.filter(e => matchesDate(e.date)),
    };
  }, [initialSales, initialExpenses, selectedDate, datePreset]);

  // Financial Calculations
  const totalRevenue = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + Number(s.totalAmount), 0);
  }, [filteredSales]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((acc, e) => acc + Number(e.amount), 0);
  }, [filteredExpenses]);

  const totalCOGS = useMemo(() => {
    return filteredSales.reduce((acc, s) => {
      return acc + s.items.reduce((itemAcc: number, item: any) => {
        const costAtSale = Number(item.costAtSale ?? (item.product?.costPrice ?? 0));
        return itemAcc + (costAtSale * item.quantity);
      }, 0);
    }, 0);
  }, [filteredSales]);

  const grossProfit = totalRevenue - totalCOGS;
  const netProfit = grossProfit - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Aggregate Top Selling Products for the filtered period
  const topProducts = useMemo(() => {
    const productSalesMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    
    filteredSales.forEach(sale => {
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

    return Array.from(productSalesMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredSales]);

  // Display title for active filter
  const activePeriodTitle = useMemo(() => {
    if (selectedDate) return formatDisplayDate(selectedDate);
    if (datePreset === 'today') return "Today's Performance";
    if (datePreset === 'yesterday') return "Yesterday's Performance";
    if (datePreset === 'week') return 'Last 7 Days';
    if (datePreset === 'month') return 'This Month';
    return 'All Time';
  }, [selectedDate, datePreset]);

  const hasFilter = Boolean(selectedDate || datePreset !== 'all');

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in max-w-7xl mx-auto pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            Financial Intelligence & Profit Auditing
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
            Business & Sales Reports
          </h1>
          <p className="text-muted-foreground text-xs sm:text-base mt-1">
            Analyze revenue, operating expenses, cost of goods, and net profit for any selected date.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {hasFilter && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearFilters}
              className="gap-1.5 text-xs rounded-xl border-dashed"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.print()}
            className="gap-1.5 text-xs rounded-xl bg-card shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Date Filtering Panel */}
      <div className="bg-card text-card-foreground border border-border rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 border-b border-border/60 pb-4">
          
          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1 shrink-0 flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" /> Period:
            </span>
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'week', label: 'Last 7 Days' },
              { id: 'month', label: 'This Month' },
            ].map(preset => {
              const isActive = (datePreset === preset.id && !selectedDate) ||
                (preset.id === 'today' && selectedDate === toLocalDateString(new Date())) ||
                (preset.id === 'all' && !selectedDate && datePreset === 'all');

              return (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Date Picker Input */}
          <div className="flex items-center gap-2 self-start lg:self-auto w-full lg:w-auto">
            <div className="relative flex-1 lg:w-48">
              <Calendar className="w-4 h-4 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleCustomDateChange(e.target.value)}
                className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-foreground"
                aria-label="Filter report by date"
              />
            </div>
            {selectedDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCustomDateChange('')}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Dates with Sales Dropdown */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">
              Quick Select Sales Date:
            </span>
            <div className="relative flex-1 sm:w-72">
              <select
                value={selectedDate}
                onChange={(e) => handleCustomDateChange(e.target.value)}
                className="w-full appearance-none bg-muted/40 hover:bg-muted/70 transition-colors border border-border rounded-xl px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-blue-600 pr-8 cursor-pointer"
              >
                <option value="">
                  {datesWithSales.length > 0 
                    ? `-- Choose from ${datesWithSales.length} sales dates --` 
                    : '-- No sales dates found --'}
                </option>
                {datesWithSales.map(d => (
                  <option key={d.date} value={d.date}>
                    {d.displayDate} • {d.count} sales (GH₵{d.revenue.toFixed(2)})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="text-xs text-muted-foreground font-semibold">
            Active: <span className="text-blue-600 font-bold">{activePeriodTitle}</span> ({filteredSales.length} sales analyzed)
          </div>
        </div>
      </div>

      {/* KPI Cards Grid for Selected Date/Period */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Gross Sales Revenue */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl shadow-lg shadow-blue-600/15 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-blue-100 uppercase tracking-wider">Gross Sales Revenue</p>
            <div className="p-2 bg-white/20 rounded-xl">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black">GH₵{totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-blue-100 mt-2 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            {activePeriodTitle}
          </p>
        </div>

        {/* Operating Expenses */}
        <div className="p-5 sm:p-6 bg-card rounded-3xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Operating Expenses</p>
            <div className="p-2 bg-red-500/10 text-red-600 rounded-xl">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-red-600">GH₵{totalExpenses.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-2 font-medium">
            {filteredExpenses.length} expense entries
          </p>
        </div>

        {/* Real COGS */}
        <div className="p-5 sm:p-6 bg-card rounded-3xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cost of Goods (COGS)</p>
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600">GH₵{totalCOGS.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-2 font-medium">
            Cost of items sold
          </p>
        </div>

        {/* Estimated Net Profit */}
        <div className="p-5 sm:p-6 bg-card rounded-3xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Estimated Net Profit</p>
            <div className={`p-2 rounded-xl ${netProfit >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-2xl sm:text-3xl font-black ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            GH₵{netProfit.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-2 font-medium flex items-center gap-1">
            <Percent className="w-3 h-3" />
            Margin: <strong className={profitMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}>{profitMargin.toFixed(1)}%</strong>
          </p>
        </div>
      </div>

      {/* Top Products & Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Products for Selected Period */}
        <div className="p-6 bg-card rounded-3xl border border-border space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Top Selling Products</h3>
                <p className="text-xs text-muted-foreground">Highest volume items for {activePeriodTitle}</p>
              </div>
            </div>
            <span className="text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-full">
              {topProducts.length} items
            </span>
          </div>
          
          <div className="space-y-3 pt-2">
            {topProducts.length > 0 ? topProducts.map((p, i) => (
              <div key={i} className="flex justify-between items-center p-3.5 rounded-2xl bg-muted/40 border border-border hover:bg-muted/70 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-black">
                    #{i + 1}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">{p.quantity} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-blue-600 dark:text-blue-400">GH₵{p.revenue.toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold">Revenue</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 text-muted-foreground text-xs space-y-2">
                <Package className="w-8 h-8 opacity-30 mx-auto" />
                <p>No sales or product activity recorded for {activePeriodTitle}.</p>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Breakdown Card */}
        <div className="p-6 bg-card rounded-3xl border border-border space-y-5">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Financial Summary Statement</h3>
              <p className="text-xs text-muted-foreground">P&L summary for {activePeriodTitle}</p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex justify-between items-center p-3 rounded-xl bg-muted/40">
              <span className="text-xs font-semibold text-muted-foreground">Gross Revenue (+)</span>
              <span className="text-sm font-black text-blue-600 dark:text-blue-400">GH₵{totalRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-muted/40">
              <span className="text-xs font-semibold text-muted-foreground">Cost of Goods Sold - COGS (-)</span>
              <span className="text-sm font-bold text-amber-600">GH₵{totalCOGS.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-muted/60">
              <span className="text-xs font-bold text-foreground">Gross Profit</span>
              <span className="text-sm font-black text-foreground">GH₵{grossProfit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-muted/40">
              <span className="text-xs font-semibold text-muted-foreground">Operating Expenses (-)</span>
              <span className="text-sm font-bold text-red-600">GH₵{totalExpenses.toFixed(2)}</span>
            </div>
            <div className={`flex justify-between items-center p-3.5 rounded-xl border ${netProfit >= 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <span className="text-xs font-black uppercase tracking-wider text-foreground">Net Profit</span>
              <span className={`text-base font-black ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                GH₵{netProfit.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
