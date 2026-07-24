'use client';
import { useState } from 'react';
import { Scale, Plus, Trash2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { createUnit, deleteUnit } from '@/app/actions/inventory';

export default function UnitsClient({ initialUnits }: { initialUnits: any[] }) {
  const [units, setUnits] = useState(initialUnits);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = units.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.shortName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !shortName.trim()) return;

    setIsSubmitting(true);
    try {
      const newUnit = await createUnit(name.trim(), shortName.trim());
      setUnits(prev => [...prev, { ...newUnit, products: [] }].sort((a, b) => a.name.localeCompare(b.name)));
      setIsAddOpen(false);
      setName('');
      setShortName('');
    } catch (err: any) {
      alert('Failed to add unit: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUnit = async (id: string, productCount: number) => {
    if (productCount > 0) {
      alert(`Cannot delete this unit because it is currently assigned to ${productCount} product(s). Please reassign the products first.`);
      return;
    }

    if (!confirm('Are you sure you want to delete this unit?')) return;

    try {
      await deleteUnit(id);
      setUnits(prev => prev.filter(u => u.id !== id));
    } catch (err: any) {
      alert('Failed to delete unit: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Product Measurement Units</h1>
          <p className="text-muted-foreground text-sm">Define packaging units, lengths, sheet counts, and unit labels.</p>
        </div>

        <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/10">
          <Plus className="w-4 h-4" /> Add Unit
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search units..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-9 h-11 rounded-xl bg-card border-border shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(u => {
          const productCount = u.products?.length || 0;
          return (
            <div key={u.id} className="p-6 bg-card text-card-foreground rounded-3xl border border-border shadow-sm flex flex-col justify-between space-y-4 group hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
                    <Scale className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {u.name} <span className="text-xs font-mono font-bold bg-muted px-2 py-0.5 rounded text-muted-foreground ml-1.5">{u.shortName}</span>
                    </h3>
                    <p className="text-xs text-muted-foreground">{productCount} product(s) linked</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleDeleteUnit(u.id, productCount)}
                  className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete Unit"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No units found matching your search.
          </div>
        )}
      </div>

      {/* Add Unit Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-600" /> Create Measurement Unit
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddUnit} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Unit Full Name *</label>
              <Input
                placeholder="e.g. Pieces, Sheets, Meters, Bundles"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="rounded-xl h-11"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Short Name / Symbol *</label>
              <Input
                placeholder="e.g. Pc(s), Sheet, m, Bdl"
                value={shortName}
                onChange={e => setShortName(e.target.value)}
                required
                className="rounded-xl h-11 font-mono font-bold"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6">
                {isSubmitting ? 'Saving...' : 'Save Unit'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
