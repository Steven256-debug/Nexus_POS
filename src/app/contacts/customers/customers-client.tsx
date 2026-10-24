'use client';

import { useState } from 'react';
import { UserCheck, Search, Plus, Phone, Mail, Wallet } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function CustomersClient({ initialCustomers, groups }: { initialCustomers: any[]; groups: any[] }) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [groupId, setGroupId] = useState('');
  const [creditLimit, setCreditLimit] = useState('');

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone || '').includes(searchTerm) ||
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, groupId, creditLimit })
      });
      const newCust = await res.json();
      setCustomers([newCust, ...customers]);
      setIsAddOpen(false);
      setName('');
      setPhone('');
      setEmail('');
      setGroupId('');
      setCreditLimit('');
    } catch {
      toast.error('Failed to add customer');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">Customer Directory</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Manage contractor profiles and customer credit accounts.</p>
        </div>

        <Button onClick={() => setIsAddOpen(true)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Add New Customer
        </Button>
      </div>

      <div className="relative max-w-md w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search customer by name or phone..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-9 h-11 rounded-xl bg-card border-border shadow-sm text-sm"
        />
      </div>

      <div className="bg-card text-card-foreground rounded-3xl border border-border shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/60 text-muted-foreground font-bold uppercase text-xs border-b border-border">
              <tr>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Phone / Email</th>
                <th className="p-4">Pricing Tier</th>
                <th className="p-4 text-right">Credit Limit (GH₵)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-muted/40 transition-colors">
                  <td className="p-4 font-bold text-foreground">{c.name}</td>
                  <td className="p-4">
                    <div className="flex flex-col text-xs">
                      <span className="font-medium text-foreground">{c.phone || 'N/A'}</span>
                      <span className="text-muted-foreground">{c.email || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-600 font-bold text-xs">
                      {c.group?.name || 'Retail Customers'} ({c.group?.discount || 0}% Off)
                    </span>
                  </td>
                  <td className="p-4 text-right font-black text-emerald-600">GH₵{Number(c.creditLimit).toFixed(2)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">No customers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="block sm:hidden divide-y divide-border">
          {filtered.map(c => (
            <div key={c.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-foreground text-sm leading-tight">{c.name}</span>
                <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-bold text-[11px]">
                  {c.group?.name || 'Retail'} {c.group?.discount ? `(${c.group.discount}% Off)` : ''}
                </span>
              </div>

              <div className="space-y-1 text-xs text-muted-foreground">
                {c.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>{c.phone}</span>
                  </div>
                )}
                {c.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                {!c.phone && !c.email && (
                  <span className="text-muted-foreground italic">No contact details registered</span>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-emerald-600" /> Credit Limit:
                </span>
                <span className="font-black text-emerald-600 text-sm">
                  GH₵{Number(c.creditLimit).toFixed(2)}
                </span>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No customers found.
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" /> Add New Customer
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCustomer} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Full Name *</label>
              <Input placeholder="e.g. Kwame Mensah" value={name} onChange={e => setName(e.target.value)} required className="rounded-xl h-11" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Phone Number</label>
                <Input placeholder="+233 50..." value={phone} onChange={e => setPhone(e.target.value)} className="rounded-xl h-11" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Email</label>
                <Input placeholder="customer@mail.com" value={email} onChange={e => setEmail(e.target.value)} className="rounded-xl h-11" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Customer Group</label>
                <select
                  value={groupId}
                  onChange={e => setGroupId(e.target.value)}
                  className="w-full h-11 rounded-xl bg-card border border-border px-3 text-sm font-medium"
                >
                  <option value="">Standard Retail</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name} ({g.discount}%)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Credit Limit (GH₵)</label>
                <Input type="number" placeholder="0.00" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} className="rounded-xl h-11 font-bold" />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6">Save Customer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
