'use client';

import { useState } from 'react';
import { Users, Plus, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function GroupsClient({ initialGroups }: { initialGroups: any[] }) {
  const [groups, setGroups] = useState(initialGroups);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [name, setName] = useState('');
  const [discount, setDiscount] = useState('');

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      const res = await fetch('/api/customer-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, discount })
      });
      const newGroup = await res.json();
      setGroups([...groups, newGroup]);
      setIsAddOpen(false);
      setName('');
      setDiscount('');
    } catch {
      alert('Failed to add group');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Customer Groups & Pricing Tiers</h1>
          <p className="text-muted-foreground text-sm">Configure wholesale, contractor, and retail discount structures.</p>
        </div>

        <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Pricing Group
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {groups.map(g => (
          <div key={g.id} className="p-6 bg-card text-card-foreground rounded-3xl border border-border shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pricing Tier</span>
                <h3 className="text-xl font-bold text-foreground mt-1">{g.name}</h3>
              </div>
              <span className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
                <Tag className="w-6 h-6" />
              </span>
            </div>

            <div className="pt-4 border-t border-border flex justify-between items-end">
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Automatic Discount</p>
                <p className="text-3xl font-black text-emerald-600">{g.discount}% Off</p>
              </div>
              <span className="text-xs font-bold bg-muted px-3 py-1 rounded-xl text-muted-foreground">
                {g.customers?.length || 0} Members
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Group Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" /> Create Customer Group
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddGroup} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Group / Tier Name *</label>
              <Input placeholder="e.g. VIP Contractors" value={name} onChange={e => setName(e.target.value)} required className="rounded-xl h-11" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Default Discount Percentage (%) *</label>
              <Input type="number" step="0.1" placeholder="e.g. 7.5" value={discount} onChange={e => setDiscount(e.target.value)} required className="rounded-xl h-11 font-bold text-lg" />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6">Save Group</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
