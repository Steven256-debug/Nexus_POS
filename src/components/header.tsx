'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Calculator, 
  Calendar, 
  Bell, 
  Building2, 
  ShoppingCart, 
  User as DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ThemeToggle } from './theme-toggle';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { safeEvaluate } from '@/lib/safe-math';
import { toast } from 'sonner';

export function TopHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  
  const [currentDate, setCurrentDate] = useState('');
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isQuickExpenseOpen, setIsQuickExpenseOpen] = useState(false);
  const [calcInput, setCalcInput] = useState('');
  const [calcResult, setCalcResult] = useState('');

  // Quick expense form states
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');

  useEffect(() => {
    const today = new Date();
    const formatted = today.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
    setCurrentDate(formatted);
  }, []);



  const handleCalcClick = (val: string) => {
    if (val === '=') {
      try {
        const res = safeEvaluate(calcInput);
        setCalcResult(String(res));
      } catch {
        setCalcResult('Error');
      }
    } else if (val === 'C') {
      setCalcInput('');
      setCalcResult('');
    } else {
      setCalcInput(prev => prev + val);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseCategory || !expenseAmount) return;
    try {
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: expenseCategory,
          amount: parseFloat(expenseAmount),
          description: expenseDesc
        })
      });
      setIsQuickExpenseOpen(false);
      setExpenseCategory('');
      setExpenseAmount('');
      setExpenseDesc('');
      toast.success('Expense recorded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to record expense');
    }
  };

  const displayName = session?.user?.name || session?.user?.email || 'User';
  const roleName = session?.user?.role || 'Role';

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle Ctrl+K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      router.push(`/inventory?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { name: 'Point of Sale (POS)', href: '/pos' },
    { name: 'Inventory / Products', href: '/inventory' },
    { name: 'Add Product', href: '/inventory/add' },
    { name: 'All Sales', href: '/sales' },
    { name: 'Expenses', href: '/expenses' },
    { name: 'Reports', href: '/reports' },
    { name: 'Settings', href: '/settings' },
    { name: 'Customers', href: '/contacts/customers' },
    { name: 'Suppliers', href: '/contacts/suppliers' },
  ];

  const filteredLinks = navLinks.filter(link => 
    link.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (pathname === '/login' || pathname?.startsWith('/receipt')) return null;

  return (
    <>
      <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between gap-4 shadow-sm">
        {/* Left: Location Switcher & Search */}
        <div className="flex items-center gap-4 flex-1 max-w-xl">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold text-xs border border-blue-500/20 whitespace-nowrap">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>POS Terminal</span>
          </div>

          <div 
            className="relative flex-1 cursor-text min-w-0"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <div className="flex items-center pl-9 pr-2 h-10 rounded-xl bg-muted/50 border border-border text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors overflow-hidden">
              <span className="truncate flex-1 text-left">Search menu or scan...</span>
              <span className="ml-2 text-[10px] bg-background border border-border px-1.5 py-0.5 rounded-md hidden sm:block shrink-0 shadow-sm font-semibold">Ctrl K</span>
            </div>
          </div>
        </div>

        {/* Right: Quick Tools Toolbar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Direct POS Link */}
          <Link href="/pos">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 px-3 sm:px-4">
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">POS Terminal</span>
            </Button>
          </Link>

          {/* Add Expense Quick Button */}
          <button
            onClick={() => setIsQuickExpenseOpen(true)}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors relative"
            title="Add Quick Expense"
          >
            <DollarSign className="w-5 h-5" />
          </button>

          {/* Calculator Shortcut */}
          <button
            onClick={() => setIsCalculatorOpen(true)}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
            title="Calculator"
          >
            <Calculator className="w-5 h-5" />
          </button>

          {/* Date Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-muted/50 rounded-xl border border-border text-muted-foreground">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span>{currentDate}</span>
          </div>

          {/* Notification Bell */}
          <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          </button>

          <ThemeToggle />

          {/* User Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-600 font-bold flex items-center justify-center text-xs">
              {displayName[0]?.toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block overflow-hidden text-left">
              <p className="text-xs font-bold leading-tight text-foreground truncate">{displayName}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{roleName}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Calculator Modal */}
      <Dialog open={isCalculatorOpen} onOpenChange={setIsCalculatorOpen}>
        <DialogContent className="max-w-xs rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" /> System Calculator
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-muted p-4 rounded-xl text-right font-mono">
              <div className="text-xs text-muted-foreground h-4">{calcInput || '0'}</div>
              <div className="text-2xl font-bold text-foreground overflow-x-auto">{calcResult || calcInput || '0'}</div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {['C', '/', '*', '-'].map(b => (
                <Button key={b} variant="secondary" className="font-bold text-lg h-12 rounded-xl" onClick={() => handleCalcClick(b)}>{b}</Button>
              ))}
              {['7', '8', '9', '+'].map(b => (
                <Button key={b} variant="outline" className="font-bold text-lg h-12 rounded-xl" onClick={() => handleCalcClick(b)}>{b}</Button>
              ))}
              {['4', '5', '6', '='].map(b => (
                <Button key={b} variant={b === '=' ? 'default' : 'outline'} className={`font-bold text-lg h-12 rounded-xl ${b === '=' ? 'bg-blue-600 hover:bg-blue-700 text-white row-span-2' : ''}`} onClick={() => handleCalcClick(b)}>{b}</Button>
              ))}
              {['1', '2', '3'].map(b => (
                <Button key={b} variant="outline" className="font-bold text-lg h-12 rounded-xl" onClick={() => handleCalcClick(b)}>{b}</Button>
              ))}
              {['0', '.'].map(b => (
                <Button key={b} variant="outline" className={`font-bold text-lg h-12 rounded-xl ${b === '0' ? 'col-span-2' : ''}`} onClick={() => handleCalcClick(b)}>{b}</Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Add Expense Modal */}
      <Dialog open={isQuickExpenseOpen} onOpenChange={setIsQuickExpenseOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" /> Record Quick Expense
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddExpense} className="space-y-4 pt-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Expense Category</label>
              <Input
                placeholder="e.g. Transportation, Utilities, Supplies"
                value={expenseCategory}
                onChange={e => setExpenseCategory(e.target.value)}
                required
                className="rounded-xl h-11"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Amount (GH₵)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={expenseAmount}
                onChange={e => setExpenseAmount(e.target.value)}
                required
                className="rounded-xl h-11 font-bold text-lg"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Description / Note</label>
              <Input
                placeholder="Optional expense details..."
                value={expenseDesc}
                onChange={e => setExpenseDesc(e.target.value)}
                className="rounded-xl h-11"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsQuickExpenseOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-6">Save Expense</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Search Modal */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent showCloseButton={false} className="max-w-lg p-0 rounded-2xl overflow-hidden gap-0 bg-background border border-border shadow-2xl">
          <form onSubmit={handleSearchSubmit} className="flex items-center border-b border-border px-4 py-3 bg-zinc-100 dark:bg-zinc-900">
            <Search className="w-5 h-5 text-muted-foreground mr-3" />
            <input
              autoFocus
              className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
              placeholder="Search for pages, settings, or products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md border border-border">ESC</span>
          </form>
          
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {searchQuery.trim() && (
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Menu Links
              </div>
            )}
            
            <div className="flex flex-col gap-1">
              {filteredLinks.length > 0 ? filteredLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => {
                    setIsSearchOpen(false);
                    router.push(link.href);
                    setSearchQuery('');
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-muted rounded-xl transition-colors text-sm font-semibold flex items-center justify-between group"
                >
                  {link.name}
                  <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    Jump to
                  </span>
                </button>
              )) : (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  <p>No menus found for "{searchQuery}".</p>
                  <p className="mt-2 text-xs">Press Enter to search Inventory instead.</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
