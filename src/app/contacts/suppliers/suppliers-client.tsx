'use client';

import { useState } from 'react';
import { Building, Search, Plus, Phone, Mail, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function SuppliersClient({ initialSuppliers }: { initialSuppliers: any[] }) {
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.phone || '').includes(searchTerm)
  );

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, companyName, phone, email })
      });
      const newSup = await res.json();
      setSuppliers([newSup, ...suppliers]);
      setIsAddOpen(false);
      setName('');
      setCompanyName('');
      setPhone('');
      setEmail('');
    } catch (err) {
      alert('Failed to add supplier');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Supplier Directory</h1>
          <p className="text-muted-foreground text-sm">Manage steel coil and hardware vendor contacts.</p>
        </div>

        <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add New Supplier
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by supplier name or company..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-9 h-11 rounded-xl bg-card border-border shadow-sm"
        />
      </div>

      <div className="bg-card text-card-foreground rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/60 text-muted-foreground font-bold uppercase text-xs border-b border-border">
              <tr>
                <th className="p-4">Supplier Name</th>
                <th className="p-4">Company Name</th>
                <th className="p-4">Contact Details</th>
                <th className="p-4 text-right">Date Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-muted/40 transition-colors">
                  <td className="p-4 font-bold text-foreground">{s.name}</td>
                  <td className="p-4 font-semibold text-blue-600">{s.companyName || 'N/A'}</td>
                  <td className="p-4">
                    <div className="flex flex-col text-xs">
                      <span className="font-medium text-foreground">{s.phone || 'N/A'}</span>
                      <span className="text-muted-foreground">{s.email || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">No suppliers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Supplier Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" /> Add New Supplier
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSupplier} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Contact Name *</label>
              <Input placeholder="e.g. Samuel Mensah" value={name} onChange={e => setName(e.target.value)} required className="rounded-xl h-11" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Company Name</label>
              <Input placeholder="e.g. Apex Ghana Steel Ltd" value={companyName} onChange={e => setCompanyName(e.target.value)} className="rounded-xl h-11" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Phone Number</label>
                <Input placeholder="+233 24..." value={phone} onChange={e => setPhone(e.target.value)} className="rounded-xl h-11" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Email</label>
                <Input placeholder="sales@company.com" value={email} onChange={e => setEmail(e.target.value)} className="rounded-xl h-11" />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6">Save Supplier</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
