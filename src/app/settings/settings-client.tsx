'use client';

import { useState } from 'react';
import { Building, ShieldCheck, Save, CheckCircle2, Percent } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { updateBusinessLocation } from '@/app/actions/settings';
import { setSetting, clearTestData } from '@/app/actions/system-settings';
import { toast } from 'sonner';
import { AlertOctagon } from 'lucide-react';

export default function SettingsClient({ initialLocation, initialSettings = {} }: { initialLocation: any; initialSettings?: Record<string, string> }) {
  const [formData, setFormData] = useState({
    name: initialLocation?.name || 'Francis Amoako Ventures',
    code: initialLocation?.code || 'BL0001',
    address: initialLocation?.address || 'Kumasi Central Market, Ghana'
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Tax settings
  const [taxRate, setTaxRate] = useState(initialSettings.tax_rate || '15');
  const [isSavingTax, setIsSavingTax] = useState(false);
  const [isTaxSaved, setIsTaxSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateBusinessLocation(initialLocation?.id, formData);
      setIsSaved(true);
      toast.success('Business profile saved');
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      toast.error('Error updating settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTax = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTax(true);
    try {
      await setSetting('tax_rate', taxRate);
      setIsTaxSaved(true);
      toast.success('Tax rate updated');
      setTimeout(() => setIsTaxSaved(false), 3000);
    } catch (error) {
      toast.error('Error updating tax rate');
    } finally {
      setIsSavingTax(false);
    }
  };

  const [isClearing, setIsClearing] = useState(false);
  const handleClearData = async () => {
    if (!window.confirm('WARNING: This will permanently delete ALL sales, returns, expenses, payments, and audit logs. Products and users will remain. Are you absolutely sure?')) {
      return;
    }
    
    setIsClearing(true);
    try {
      const res = await clearTestData('DELETE ALL TRANSACTIONS');
      if (!res.success) {
        toast.error(res.error);
      } else {
        toast.success('All transaction data cleared successfully');
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      toast.error('Error clearing test data');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <form onSubmit={handleSave} className="p-6 bg-card rounded-3xl border border-border space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Business Location Profile</h3>
              <p className="text-xs text-muted-foreground">Default store branch details</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Store Name</label>
            <Input 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              className="rounded-xl font-bold" 
              required 
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Branch Code</label>
            <Input 
              value={formData.code} 
              onChange={e => setFormData({ ...formData, code: e.target.value })} 
              className="rounded-xl font-mono text-sm" 
              required 
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Address</label>
            <Input 
              value={formData.address} 
              onChange={e => setFormData({ ...formData, address: e.target.value })} 
              className="rounded-xl" 
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          {isSaved && (
            <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold">
              <CheckCircle2 className="w-4 h-4" /> Saved
            </div>
          )}
          <Button type="submit" disabled={isSaving} className="ml-auto bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2">
            <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </form>

      {/* Tax & Pricing Settings */}
      <div className="space-y-6">
        <form onSubmit={handleSaveTax} className="p-6 bg-card rounded-3xl border border-border space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b border-border">
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Tax & Pricing</h3>
              <p className="text-xs text-muted-foreground">Default tax rate applied at checkout</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Default Tax Rate (%)</label>
              <Input 
                type="number" 
                step="0.1" 
                min="0" 
                max="100"
                value={taxRate} 
                onChange={e => setTaxRate(e.target.value)} 
                className="rounded-xl font-bold text-lg w-32" 
                required 
              />
              <p className="text-[11px] text-muted-foreground mt-1">Ghana standard VAT: 15% (12.5% VAT + 2.5% NHIL)</p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            {isTaxSaved && (
              <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold">
                <CheckCircle2 className="w-4 h-4" /> Saved
              </div>
            )}
            <Button type="submit" disabled={isSavingTax} className="ml-auto bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center gap-2">
              <Save className="w-4 h-4" /> {isSavingTax ? 'Saving...' : 'Save Tax Rate'}
            </Button>
          </div>
        </form>

        <div className="p-6 bg-card rounded-3xl border border-border space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Security & RBAC</h3>
              <p className="text-xs text-muted-foreground">Role permissions & access controls</p>
            </div>
          </div>
          <div className="space-y-2 pt-2 text-sm border-t border-border">
            <p><span className="text-muted-foreground font-semibold">Authentication Mode:</span> <span className="font-bold text-emerald-600">NextAuth JWT Active</span></p>
            <p><span className="text-muted-foreground font-semibold">Active Roles:</span> <span className="font-medium">ADMIN, EMPLOYEE</span></p>
            <p><span className="text-muted-foreground font-semibold">RBAC Status:</span> <span className="font-bold text-emerald-600">Enforced</span></p>
            <p className="text-xs text-muted-foreground mt-4 italic">Employees can view most pages but are restricted from Settings, Add Product, and Price Update.</p>
          </div>
        </div>
        <div className="p-6 bg-card rounded-3xl border border-border space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/10 text-red-600 rounded-2xl">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-600">Danger Zone</h3>
              <p className="text-xs text-muted-foreground">Destructive actions for Admins only</p>
            </div>
          </div>
          <div className="pt-2 text-sm border-t border-border">
            <p className="text-muted-foreground mb-4">
              Finished testing? Clear all sales, returns, and expenses to start fresh. Your products, customers, and staff accounts will be kept.
            </p>
            <Button 
              onClick={handleClearData} 
              disabled={isClearing} 
              variant="destructive" 
              className="w-full sm:w-auto rounded-xl font-bold flex items-center gap-2"
            >
              <AlertOctagon className="w-4 h-4" /> {isClearing ? 'Clearing...' : 'Clear All Test Transactions'}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
