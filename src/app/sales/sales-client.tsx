'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  Package, 
  Receipt, 
  Search, 
  Filter, 
  RotateCcw, 
  Printer, 
  Sparkles,
  ChevronDown,
  CheckCircle2,
  CalendarDays,
  Wallet,
  ArrowRight
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ReturnModal } from './return-modal';

interface SaleItem {
  id: string;
  productId: string;
  quantity: number;
  priceAtSale: number;
  costAtSale?: number;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
}

interface Sale {
  id: string;
  invoiceNo: string;
  cashierId: string;
  cashier?: {
    id?: string;
    name?: string | null;
    email?: string;
  };
  customerId?: string | null;
  customer?: {
    id?: string;
    name: string;
    phone?: string | null;
  } | null;
  status: string;
  paymentMethod: string;
  totalAmount: number;
  discountAmount?: number;
  taxAmount?: number;
  paidAmount?: number;
  changeAmount?: number;
  createdAt: string | Date;
  items: SaleItem[];
  payments?: {
    method: string;
    amount: number;
  }[];
}

interface SalesClientProps {
  initialSales: Sale[];
  userRole?: string;
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

export function SalesClient({ initialSales, userRole = 'EMPLOYEE' }: SalesClientProps) {
  const [sales] = useState<Sale[]>(initialSales);
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Compute unique dates where sales were made with count and revenue summary
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

  // Handle Preset Clicks
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
      setSelectedDate(''); // Range based filter handled in filteredSales
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
    setStatusFilter('ALL');
  };

  // Filter sales based on selected date, preset, search and payment
  const filteredSales = useMemo(() => {
    const todayStr = toLocalDateString(new Date());
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    return sales.filter(sale => {
      const saleDateStr = toLocalDateString(sale.createdAt);
      const saleDateObj = new Date(sale.createdAt);

      // 1. Date Filtering
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

      // 2. Status Filtering
      if (statusFilter !== 'ALL' && sale.status !== statusFilter) {
        return false;
      }

      // 3. Payment Method Filtering
      if (paymentFilter !== 'ALL') {
        const pMethod = (sale.paymentMethod || '').toUpperCase();
        if (pMethod !== paymentFilter.toUpperCase()) return false;
      }

      // 4. Search Query Filtering
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const invoice = (sale.invoiceNo || '').toLowerCase();
        const id = (sale.id || '').toLowerCase();
        const cashierName = (sale.cashier?.name || sale.cashier?.email || sale.cashierId || '').toLowerCase();
        const customerName = (sale.customer?.name || '').toLowerCase();
        const itemNames = sale.items.map(i => i.product?.name?.toLowerCase() || '').join(' ');

        const matches = 
          invoice.includes(q) || 
          id.includes(q) || 
          cashierName.includes(q) || 
          customerName.includes(q) || 
          itemNames.includes(q);

        if (!matches) return false;
      }

      return true;
    });
  }, [sales, selectedDate, datePreset, statusFilter, paymentFilter, searchQuery]);

  // Aggregate Metrics for the Filtered / Selected Date
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let totalItems = 0;
    const paymentBreakdown: Record<string, number> = {};

    filteredSales.forEach(sale => {
      const amt = Number(sale.totalAmount) || 0;
      totalRevenue += amt;

      const itemsQty = sale.items.reduce((acc, item) => acc + (item.quantity || 0), 0);
      totalItems += itemsQty;

      const method = (sale.paymentMethod || 'CASH').toUpperCase();
      paymentBreakdown[method] = (paymentBreakdown[method] || 0) + amt;
    });

    const salesCount = filteredSales.length;
    const averageOrderValue = salesCount > 0 ? totalRevenue / salesCount : 0;

    return {
      totalRevenue,
      salesCount,
      totalItems,
      averageOrderValue,
      paymentBreakdown
    };
  }, [filteredSales]);

  // Active Filter Description
  const activeDateTitle = useMemo(() => {
    if (selectedDate) {
      return formatDisplayDate(selectedDate);
    }
    if (datePreset === 'today') return "Today's Sales";
    if (datePreset === 'yesterday') return "Yesterday's Sales";
    if (datePreset === 'week') return 'Last 7 Days';
    if (datePreset === 'month') return 'This Month';
    return 'All Time';
  }, [selectedDate, datePreset]);

  const hasActiveFilters = Boolean(selectedDate || datePreset !== 'all' || searchQuery || paymentFilter !== 'ALL' || statusFilter !== 'ALL');

  return (
    <div className="p-2 sm:p-4 md:p-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold mb-2">
            <Receipt className="w-3.5 h-3.5" />
            POS Transaction Ledger & Revenue Audit
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
            Sales & Revenue History
          </h1>
          <p className="text-muted-foreground text-xs sm:text-base mt-1">
            Filter transactions by date to audit daily revenue, items sold, and payment methods.
          </p>
        </div>

        {/* Quick Print / Reset Actions */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearFilters}
              className="gap-1.5 text-xs rounded-xl border-dashed hover:bg-muted"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.print()}
            className="gap-1.5 text-xs rounded-xl bg-card hover:bg-muted shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Date Filtering Control Panel */}
      <div className="bg-card text-card-foreground border border-border/80 rounded-3xl p-4 sm:p-6 shadow-sm space-y-5">
        
        {/* Row 1: Presets & Date Selector */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 border-b border-border/60 pb-5">
          
          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1 shrink-0 flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" /> Filter:
            </span>
            {[
              { id: 'all', label: 'All Dates' },
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
                aria-label="Filter by specific date"
              />
            </div>
            {selectedDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCustomDateChange('')}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                title="Clear selected date"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Row 2: Select a Date Where Sales Were Made & Search */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          
          {/* "Dates with Sales" Dropdown Selector */}
          <div className="lg:col-span-5 space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Select Date With Recorded Sales ({datesWithSales.length} available):
            </label>
            <div className="relative">
              <select
                value={selectedDate}
                onChange={(e) => handleCustomDateChange(e.target.value)}
                className="w-full appearance-none bg-muted/40 hover:bg-muted/70 transition-colors border border-border rounded-xl px-3.5 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-blue-600 pr-9 cursor-pointer"
              >
                <option value="">
                  {datesWithSales.length > 0 
                    ? `-- Choose from active sales dates (${datesWithSales.length} dates found) --`
                    : '-- No sales dates found --'}
                </option>
                {datesWithSales.map(d => (
                  <option key={d.date} value={d.date}>
                    {d.displayDate} &nbsp;•&nbsp; {d.count} {d.count === 1 ? 'sale' : 'sales'} (GH₵{d.revenue.toFixed(2)})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Search Input */}
          <div className="lg:col-span-4 space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-blue-500" />
              Search Transactions:
            </label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search invoice #, cashier, customer, product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background text-xs pl-8 h-9 rounded-xl"
              />
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Payment Method Filter */}
          <div className="lg:col-span-3 space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-500" />
              Payment Method:
            </label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-blue-600 h-9"
            >
              <option value="ALL">All Payment Methods</option>
              <option value="CASH">Cash</option>
              <option value="MOMO">Mobile Money</option>
              <option value="CARD">Bank Card</option>
              <option value="SPLIT">Split Payment</option>
            </select>
          </div>
        </div>

        {/* Quick Date Pills for the most recent 4 sales dates */}
        {datesWithSales.length > 0 && !selectedDate && datePreset === 'all' && (
          <div className="pt-2 border-t border-border/40 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-muted-foreground">Recent Sales Days:</span>
            {datesWithSales.slice(0, 4).map(d => (
              <button
                key={d.date}
                onClick={() => handleCustomDateChange(d.date)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-[11px] font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors"
              >
                <span>{d.date}</span>
                <span className="bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 rounded text-[10px] font-bold">
                  GH₵{d.revenue.toFixed(0)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Date Revenue & Performance Summary KPI Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Financial Summary for:
            </h2>
            <span className="px-3 py-0.5 rounded-full bg-blue-600 text-white text-xs font-bold shadow-sm">
              {activeDateTitle}
            </span>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            Showing {filteredSales.length} {filteredSales.length === 1 ? 'transaction' : 'transactions'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Revenue for Selected Date */}
          <div className="p-5 bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 text-white rounded-3xl shadow-lg shadow-blue-600/15 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-blue-100 uppercase tracking-wider">
                {selectedDate ? 'Revenue on Date' : 'Total Revenue'}
              </span>
              <div className="p-2 bg-white/20 rounded-xl">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black tracking-tight">
              GH₵{metrics.totalRevenue.toFixed(2)}
            </p>
            <p className="text-xs text-blue-100 mt-1 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              {activeDateTitle}
            </p>
          </div>

          {/* Card 2: Transactions Count */}
          <div className="p-5 bg-card text-card-foreground border border-border rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Transactions
              </span>
              <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-foreground">
              {metrics.salesCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Completed checkouts
            </p>
          </div>

          {/* Card 3: Items Sold */}
          <div className="p-5 bg-card text-card-foreground border border-border rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Items Sold
              </span>
              <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-foreground">
              {metrics.totalItems}
            </p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Total product units
            </p>
          </div>

          {/* Card 4: Average Order Value */}
          <div className="p-5 bg-card text-card-foreground border border-border rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Avg. Ticket Size
              </span>
              <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-foreground">
              GH₵{metrics.averageOrderValue.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Average per customer
            </p>
          </div>
        </div>

        {/* Payment Breakdown Bar */}
        {metrics.salesCount > 0 && Object.keys(metrics.paymentBreakdown).length > 0 && (
          <div className="p-3.5 bg-card border border-border rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground font-bold">
              <Wallet className="w-4 h-4 text-blue-600" />
              <span>Payment Breakdown for {activeDateTitle}:</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {Object.entries(metrics.paymentBreakdown).map(([method, amount]) => (
                <div key={method} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 border border-border/80">
                  <span className="font-semibold text-muted-foreground uppercase">{method}:</span>
                  <span className="font-black text-blue-600 dark:text-blue-400">
                    GH₵{amount.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    ({metrics.totalRevenue > 0 ? Math.round((amount / metrics.totalRevenue) * 100) : 0}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Transactions List Table & Cards */}
      <div className="bg-card text-card-foreground border border-border rounded-3xl shadow-sm overflow-hidden">
        
        {/* Table Header Bar */}
        <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base sm:text-lg">
              Sales Records
            </h3>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-full">
              {filteredSales.length} items
            </span>
          </div>

          {selectedDate && (
            <div className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <span>Date Filter: <strong>{selectedDate}</strong></span>
              <button 
                onClick={() => handleCustomDateChange('')}
                className="text-blue-600 hover:underline font-bold"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <Table className="min-w-[850px]">
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Invoice / Receipt ID</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Cashier</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map((sale) => {
                const totalItemQty = sale.items.reduce((sum, item) => sum + item.quantity, 0);
                const displayId = sale.invoiceNo || sale.id.slice(0, 8).toUpperCase();
                const cashierDisplay = sale.cashier?.name || sale.cashier?.email || sale.cashierId.slice(0, 8);
                const customerDisplay = sale.customer?.name || 'Walk-in Retail';

                return (
                  <TableRow key={sale.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-xs font-bold">
                      <div className="flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-blue-600" />
                        <span>{displayId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-xs text-foreground">
                        {new Date(sale.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-foreground">
                      {cashierDisplay}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {customerDisplay}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-semibold text-foreground">
                        {totalItemQty} {totalItemQty === 1 ? 'item' : 'items'}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[180px]" title={sale.items.map(i => `${i.quantity}x ${i.product?.name || 'Item'}`).join(', ')}>
                        {sale.items.slice(0, 2).map(i => `${i.quantity}x ${i.product?.name || 'Item'}`).join(', ')}
                        {sale.items.length > 2 && '...'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-muted text-[11px] font-bold uppercase tracking-wider border-0">
                        {sale.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-black text-sm text-blue-600 dark:text-blue-400">
                      GH₵{Number(sale.totalAmount).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ReturnModal sale={sale as any} />
                        <Link 
                          href={`/receipt/${sale.id}`} 
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg transition-colors hover:bg-blue-100"
                        >
                          Receipt
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filteredSales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                        <Calendar className="w-6 h-6 opacity-40" />
                      </div>
                      <h4 className="font-bold text-foreground">No sales found</h4>
                      <p className="text-xs text-muted-foreground">
                        {selectedDate 
                          ? `No sales transactions were recorded on ${formatDisplayDate(selectedDate)}.`
                          : 'No sales match your current filter criteria.'}
                      </p>
                      {hasActiveFilters && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleClearFilters}
                          className="text-xs rounded-xl mt-2"
                        >
                          Clear Filters & View All
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards View */}
        <div className="block sm:hidden divide-y divide-border">
          {filteredSales.map((sale) => {
            const totalItemQty = sale.items.reduce((sum, item) => sum + item.quantity, 0);
            const displayId = sale.invoiceNo || sale.id.slice(0, 8).toUpperCase();

            return (
              <div key={sale.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-blue-600" />
                    <span className="font-mono text-xs font-bold text-foreground">
                      #{displayId}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs uppercase font-semibold">
                    {sale.paymentMethod}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(sale.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} {' '}
                      {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{totalItemQty} {totalItemQty === 1 ? 'item' : 'items'}</span>
                  </div>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-xs text-muted-foreground">
                    Cashier: {sale.cashier?.name || sale.cashier?.email?.split('@')[0] || 'Staff'}
                  </span>
                  <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                    GH₵{Number(sale.totalAmount).toFixed(2)}
                  </span>
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                  <ReturnModal sale={sale as any} />
                  <Link
                    href={`/receipt/${sale.id}`}
                    className="inline-flex items-center justify-center text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-lg hover:bg-blue-100"
                  >
                    View Receipt
                  </Link>
                </div>
              </div>
            );
          })}

          {filteredSales.length === 0 && (
            <div className="text-center py-12 px-4 space-y-3">
              <Calendar className="w-10 h-10 text-muted-foreground mx-auto opacity-30" />
              <p className="text-sm font-bold text-foreground">No sales found</p>
              <p className="text-xs text-muted-foreground">
                {selectedDate 
                  ? `No sales recorded on ${formatDisplayDate(selectedDate)}.`
                  : 'No sales match your current search.'}
              </p>
              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClearFilters}
                  className="text-xs rounded-xl"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
