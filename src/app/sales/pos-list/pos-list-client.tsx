'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  CalendarDays, 
  DollarSign, 
  Receipt, 
  Search, 
  Clock, 
  RotateCcw, 
  Printer, 
  Sparkles,
  ChevronDown,
  ShoppingBag,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Sale {
  id: string;
  invoiceNo: string;
  cashierId: string;
  cashier: {
    id?: string;
    name?: string | null;
    email?: string;
  };
  customer?: {
    id?: string;
    name: string;
  } | null;
  paymentMethod: string;
  totalAmount: number;
  createdAt: string | Date;
  items: {
    quantity: number;
    product?: {
      name: string;
    } | null;
  }[];
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

export function PosListClient({ initialSales }: { initialSales: Sale[] }) {
  const [sales] = useState<Sale[]>(initialSales);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL');

  // Dates with sales
  const datesWithSales = useMemo(() => {
    const map = new Map<string, { date: string; displayDate: string; count: number; revenue: number }>();
    sales.forEach(sale => {
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
  }, [sales]);

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
    } else {
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
    setSearchQuery('');
    setPaymentFilter('ALL');
  };

  // Filtered sales
  const filteredSales = useMemo(() => {
    const todayStr = toLocalDateString(new Date());
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    return sales.filter(sale => {
      const saleDateStr = toLocalDateString(sale.createdAt);
      const saleDateObj = new Date(sale.createdAt);

      if (selectedDate) {
        if (saleDateStr !== selectedDate) return false;
      } else if (datePreset === 'today') {
        if (saleDateStr !== todayStr) return false;
      } else if (datePreset === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (saleDateStr !== toLocalDateString(yesterday)) return false;
      } else if (datePreset === 'week') {
        if (saleDateObj < sevenDaysAgo) return false;
      } else if (datePreset === 'month') {
        if (saleDateObj.getFullYear() !== currentYear || saleDateObj.getMonth() !== currentMonth) return false;
      }

      if (paymentFilter !== 'ALL') {
        if ((sale.paymentMethod || '').toUpperCase() !== paymentFilter.toUpperCase()) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const invoice = (sale.invoiceNo || '').toLowerCase();
        const id = (sale.id || '').toLowerCase();
        const cashierName = (sale.cashier.name || sale.cashier.email || sale.cashierId || '').toLowerCase();
        const customerName = (sale.customer?.name || '').toLowerCase();
        const matches = invoice.includes(q) || id.includes(q) || cashierName.includes(q) || customerName.includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [sales, selectedDate, datePreset, paymentFilter, searchQuery]);

  // Metrics for filtered sales
  const totalRevenue = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  }, [filteredSales]);

  const totalItems = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.items.reduce((iSum, item) => iSum + item.quantity, 0), 0);
  }, [filteredSales]);

  const avgTicket = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;

  const activeTitle = selectedDate 
    ? formatDisplayDate(selectedDate)
    : datePreset === 'today' ? "Today"
    : datePreset === 'yesterday' ? "Yesterday"
    : datePreset === 'week' ? "Last 7 Days"
    : datePreset === 'month' ? "This Month"
    : "All Time";

  const hasFilter = Boolean(selectedDate || datePreset !== 'all' || searchQuery || paymentFilter !== 'ALL');

  return (
    <div className="p-4 md:p-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-2">
            <Clock className="w-3.5 h-3.5" />
            Cashier Sales Ledger & Register Audit
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
            POS Cashier Sales
          </h1>
          <p className="text-muted-foreground text-xs sm:text-base mt-1">
            Completed cash, mobile money, and card sales transactions. Filter by date to inspect register totals.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {hasFilter && (
            <Button variant="outline" size="sm" onClick={handleClearFilters} className="text-xs rounded-xl border-dashed">
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset Filters
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => window.print()} className="text-xs rounded-xl bg-card shadow-sm">
            <Printer className="w-3.5 h-3.5 mr-1" />
            Print
          </Button>
        </div>
      </div>

      {/* Date Filtering Bar */}
      <div className="bg-card text-card-foreground border border-border rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1 shrink-0 flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" /> Date:
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
                    isActive ? 'bg-blue-600 text-white shadow-md' : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto w-full lg:w-auto">
            <div className="relative flex-1 lg:w-48">
              <Calendar className="w-4 h-4 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleCustomDateChange(e.target.value)}
                className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-foreground"
              />
            </div>
            {selectedDate && (
              <Button variant="ghost" size="sm" onClick={() => handleCustomDateChange('')} className="h-8 px-2 text-xs">
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-5 space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Quick Select Sales Date ({datesWithSales.length} days found):
            </label>
            <div className="relative">
              <select
                value={selectedDate}
                onChange={(e) => handleCustomDateChange(e.target.value)}
                className="w-full appearance-none bg-muted/40 hover:bg-muted/70 transition-colors border border-border rounded-xl px-3.5 py-2 text-xs font-bold text-foreground pr-8 cursor-pointer"
              >
                <option value="">
                  {datesWithSales.length > 0 ? `-- Select a date with POS sales --` : '-- No sales recorded --'}
                </option>
                {datesWithSales.map(d => (
                  <option key={d.date} value={d.date}>
                    {d.displayDate} • {d.count} sales (GH₵{d.revenue.toFixed(2)})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="md:col-span-4 space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Search Sales:</label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search invoice #, cashier, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background text-xs pl-8 h-9 rounded-xl"
              />
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="md:col-span-3 space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Payment Method:</label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground h-9"
            >
              <option value="ALL">All Payments</option>
              <option value="CASH">Cash</option>
              <option value="MOMO">Mobile Money</option>
              <option value="CARD">Bank Card</option>
              <option value="SPLIT">Split</option>
            </select>
          </div>
        </div>
      </div>

      {/* Revenue KPI Cards for Selected Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl shadow-lg shadow-emerald-600/15">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
              {selectedDate ? 'Revenue on Date' : 'POS Total Revenue'}
            </span>
            <div className="p-2 bg-white/20 rounded-xl">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black">GH₵{totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-emerald-100 mt-1 font-medium">{activeTitle}</p>
        </div>

        <div className="p-5 bg-card rounded-3xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sales Count</span>
            <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-foreground">{filteredSales.length}</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Completed checkouts</p>
        </div>

        <div className="p-5 bg-card rounded-3xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Units Sold</span>
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-foreground">{totalItems}</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Product items</p>
        </div>

        <div className="p-5 bg-card rounded-3xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Avg. Sale</span>
            <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-foreground">GH₵{avgTicket.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Average checkout size</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-card text-card-foreground border border-border rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto pb-4 sm:pb-0">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Receipt ID</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Cashier</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map((sale) => (
                <TableRow key={sale.id} className="hover:bg-muted/50/50">
                  <TableCell className="font-mono text-xs font-bold">
                    <div className="flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-blue-600" />
                      <span>{sale.invoiceNo || sale.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-xs text-foreground">
                      {new Date(sale.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-foreground">
                    {sale.cashier.name || sale.cashier.email || sale.cashierId.slice(0, 8)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {sale.customer?.name || 'Walk-in Retail'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 font-bold px-2 py-0.5 rounded uppercase border-0 text-[11px]">
                      {sale.paymentMethod}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-black text-sm text-blue-600 dark:text-blue-400">
                    GH₵{Number(sale.totalAmount).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/receipt/${sale.id}`} className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg">
                      View Receipt
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {filteredSales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-muted-foreground text-xs">
                    No completed POS transactions recorded for {activeTitle}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
