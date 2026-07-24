'use client';

import { useState } from 'react';
import { Layers, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { createVariation, deleteVariation } from '@/app/actions/variations';

export default function VariationsClient({ initialVariations }: { initialVariations: any[] }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [varName, setVarName] = useState('');
  const [varValues, setVarValues] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAddVariation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!varName || !varValues) return;

    setIsSaving(true);
    try {
      const valuesArray = varValues.split(',').map(v => v.trim()).filter(Boolean);
      await createVariation(varName, valuesArray);
      setIsAddOpen(false);
      setVarName('');
      setVarValues('');
    } catch (error) {
      alert('Error creating variation');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this variation template?')) {
      await deleteVariation(id);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Product Variations & Attributes</h1>
          <p className="text-muted-foreground text-sm">Configure roofing sheet thickness specs, color options, and widths.</p>
        </div>

        <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Variation Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialVariations.map(v => (
          <div key={v.id} className="p-6 bg-card rounded-3xl border border-border shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{v.name}</h3>
                  <p className="text-xs text-muted-foreground">{v.options.length} options defined</p>
                </div>
              </div>
              <button onClick={() => handleDelete(v.id)} className="p-2 text-muted-foreground hover:text-red-600 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              {v.options.map((opt: any) => (
                <span key={opt.id} className="px-3 py-1 bg-muted rounded-xl text-xs font-bold text-foreground border border-border">
                  {opt.value}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Variation Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" /> Create Product Variation
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddVariation} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Variation Name *</label>
              <Input placeholder="e.g. Profile Geometry" value={varName} onChange={e => setVarName(e.target.value)} required className="rounded-xl h-11" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Options (Comma separated) *</label>
              <Input placeholder="e.g. IBR, Corrugated, Tile Profile" value={varValues} onChange={e => setVarValues(e.target.value)} required className="rounded-xl h-11" />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6">
                {isSaving ? 'Saving...' : 'Save Variation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
