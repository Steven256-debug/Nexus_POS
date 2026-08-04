import { prisma } from '@/lib/prisma';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {} from '@/components/ui/badge';
import Link from 'next/link';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function DraftSalesPage() {
  const drafts = await prisma.sale.findMany({
    where: { status: 'DRAFT' },
    include: {
      items: {
        include: { product: true }
      },
      cashier: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">Paused / Draft Transactions</h1>
        <p className="text-muted-foreground text-lg">Manage held point-of-sale transactions and resume them at checkout.</p>
      </div>

      <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto pb-4 sm:pb-0">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Draft ID</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Cashier</TableHead>
                <TableHead>Total Items</TableHead>
                <TableHead className="text-right">Estimated Total</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drafts.map((sale) => (
                <TableRow key={sale.id} className="hover:bg-muted/50/50">
                  <TableCell className="font-mono text-sm">{sale.invoiceNo || sale.id.slice(0, 8).toUpperCase()}</TableCell>
                  <TableCell>
                    <p className="font-medium">{new Date(sale.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">{new Date(sale.createdAt).toLocaleTimeString()}</p>
                  </TableCell>
                  <TableCell>{sale.cashier.name || sale.cashier.email || sale.cashierId.slice(0, 8)}</TableCell>
                  <TableCell>{sale.items.reduce((sum, item) => sum + item.quantity, 0)} items</TableCell>
                  <TableCell className="text-right font-bold text-blue-600">GH₵{sale.totalAmount.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/pos?resume=${sale.id}`}>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-1.5 ml-auto">
                        <Play className="w-3.5 h-3.5 fill-current" /> Resume Checkout
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {drafts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                    No paused transactions or draft sales found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
