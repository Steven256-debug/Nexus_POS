import { prisma } from '@/lib/prisma';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function QuotationsPage() {
  const quotations = await prisma.sale.findMany({
    where: { status: 'QUOTATION' },
    include: {
      items: {
        include: { product: true }
      },
      cashier: true,
      customer: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">Quotations & Credit Invoices</h1>
        <p className="text-muted-foreground text-lg">View pending contractor estimates, quotes, and draft pro-forma invoices.</p>
      </div>

      <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto pb-4 sm:pb-0">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Invoice No</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Client / Contractor</TableHead>
                <TableHead>Cashier</TableHead>
                <TableHead>Items Count</TableHead>
                <TableHead className="text-right">Total Quote</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotations.map((sale) => (
                <TableRow key={sale.id} className="hover:bg-muted/50/50">
                  <TableCell className="font-mono text-sm">{sale.invoiceNo || sale.id.slice(0, 8).toUpperCase()}</TableCell>
                  <TableCell>
                    <p className="font-medium">{new Date(sale.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">{new Date(sale.createdAt).toLocaleTimeString()}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">{sale.customer?.name || 'Standard Retail'}</span>
                      <span className="text-[10px] text-muted-foreground">{sale.customer?.phone || 'No Phone'}</span>
                    </div>
                  </TableCell>
                  <TableCell>{sale.cashier.name || sale.cashier.email || sale.cashierId.slice(0, 8)}</TableCell>
                  <TableCell>{sale.items.reduce((sum, item) => sum + item.quantity, 0)} items</TableCell>
                  <TableCell className="text-right font-bold text-amber-600">GH₵{sale.totalAmount.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/receipt/${sale.id}`} className="text-sm font-bold text-blue-600 hover:text-blue-700">
                      View Receipt
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {quotations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                    No active quotations or pro-forma invoices found.
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
