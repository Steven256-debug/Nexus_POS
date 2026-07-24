'use client';
import { useState } from 'react';
import { DollarSign, Plus, Calendar, TrendingDown, Receipt, Search, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function ExpensesClient({ initialExpenses }: { initialExpenses: any[] }) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [category, setCategory] = useState('Utilities');
  const [customCategory, setCustomCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['Utilities', 'Supplies', 'Rent', 'Logistics', 'Salaries', 'Maintenance', 'Marketing', 'Other'];

  const filtered = expenses.filter(e =>
    e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExpense = filtered.reduce((sum, e) => sum + e.amount, 0);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    const finalCategory = category === 'Other' && customCategory.trim() ? customCategory.trim() : category;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: finalCategory,
          amount,
          description
        })
      });
      if (!res.ok) throw new Error('API request failed');
      const newExpense = await res.json();
      setExpenses(prev => [newExpense, ...prev]);
      setIsAddOpen(false);
      setAmount('');
      setDescription('');
      setCustomCategory('');
    } catch (err: any) {
      toast.error('Failed to add expense: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Operational Expenses</h1>
          <p className="text-muted-foreground text-sm">Track business expenditures, supplies, utilities, and branch maintenance.</p>
        </div>

        <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/10">
          <Plus className="w-4 h-4" /> Record New Expense
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-card text-card-foreground rounded-3xl border border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/10 text-red-600 rounded-2xl">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Expenses</p>
              <p className="text-2xl font-black text-foreground">GH₵{totalExpense.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-card text-card-foreground rounded-3xl border border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Entries</p>
              <p className="text-2xl font-black text-foreground">{filtered.length} logs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search expenses by category or description..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-9 h-11 rounded-xl bg-card border-border shadow-sm"
        />
      </div>

      {/* Expenses Table */}
      <div className="bg-card text-card-foreground rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/30">
          <h3 className="text-lg font-bold">Expense Log History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/60 text-muted-foreground font-bold uppercase text-xs border-b border-border">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Category</th>
                <th className="p-4">Description</th>
                <th className="p-4 text-right">Amount (GH₵)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(e => (
                <tr key={e.id} className="hover:bg-muted/40 transition-colors">
                  <td className="p-4 font-semibold text-muted-foreground">{new Date(e.date).toLocaleDateString()}</td>
                  <td className="p-4 font-bold text-foreground">
                    <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-600 text-xs">{e.category}</span>
                  </td>
                  <td className="p-4 text-muted-foreground">{e.description || 'N/A'}</td>
                  <td className="p-4 text-right font-black text-red-600">GH₵{e.amount.toFixed(2)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">No expenses recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" /> Record Branch Expense
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddExpense} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Expense Category *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full h-11 rounded-xl bg-card border border-border px-3 text-sm font-semibold"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {category === 'Other' && (
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Specify Custom Category *</label>
                <Input
                  placeholder="e.g. Fuel, Tax Payment"
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  required
                  className="rounded-xl h-11"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Amount (GH₵) *</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                className="rounded-xl h-11 font-black text-lg text-red-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Description / Notes</label>
              <Input
                placeholder="e.g. Electricity bill for July"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="rounded-xl h-11"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6">
                {isSubmitting ? 'Recording...' : 'Record Expense'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
