import { prisma } from '@/lib/prisma';
import { Users, Building, UserCheck, Plus, Phone, Mail, ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ContactsPage() {
  const customers = await prisma.customer.findMany({
    include: { group: true },
    orderBy: { name: 'asc' }
  });

  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: 'asc' }
  });

  const customerGroups = await prisma.customerGroup.findMany();

  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-foreground">Contacts Management</h1>
        <p className="text-muted-foreground text-lg">Manage your customer database, supplier directory, and discount tiers.</p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-card text-card-foreground rounded-3xl border border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Customers</p>
              <p className="text-2xl font-black text-foreground">{customers.length}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-card text-card-foreground rounded-3xl border border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 text-purple-600 rounded-2xl">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Suppliers Directory</p>
              <p className="text-2xl font-black text-foreground">{suppliers.length}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-card text-card-foreground rounded-3xl border border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Customer Pricing Groups</p>
              <p className="text-2xl font-black text-foreground">{customerGroups.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Customers Section */}
      <div className="bg-card text-card-foreground rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/30 flex justify-between items-center">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" /> Customer Registry
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/60 text-muted-foreground font-bold uppercase text-xs border-b border-border">
              <tr>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Phone / Email</th>
                <th className="p-4">Customer Group</th>
                <th className="p-4 text-right">Credit Limit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.map(c => (
                <tr key={c.id} className="hover:bg-muted/40 transition-colors">
                  <td className="p-4 font-bold text-foreground">{c.name}</td>
                  <td className="p-4 text-muted-foreground">
                    <div className="flex flex-col text-xs font-medium">
                      <span>{c.phone || 'N/A'}</span>
                      <span className="text-muted-foreground/70">{c.email}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-600 font-bold text-xs">
                      {c.group?.name || 'Retail'} ({Number(c.group?.discount || 0)}% Off)
                    </span>
                  </td>
                  <td className="p-4 text-right font-black text-emerald-600">GH₵{Number(c.creditLimit).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suppliers Directory */}
      <div className="bg-card text-card-foreground rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/30">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Building className="w-5 h-5 text-purple-600" /> Supplier Directory
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/60 text-muted-foreground font-bold uppercase text-xs border-b border-border">
              <tr>
                <th className="p-4">Supplier Name</th>
                <th className="p-4">Company Name</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {suppliers.map(s => (
                <tr key={s.id} className="hover:bg-muted/40 transition-colors">
                  <td className="p-4 font-bold text-foreground">{s.name}</td>
                  <td className="p-4 text-muted-foreground font-medium">{s.companyName || 'N/A'}</td>
                  <td className="p-4 font-medium text-foreground">{s.phone}</td>
                  <td className="p-4 text-blue-600 font-medium">{s.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
