import { prisma } from '@/lib/prisma';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PosSalesPage() {
  const posSales = await prisma.sale.findMany({
    where: { 
      status: 'COMPLETED'
    },
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
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">POS Cashier Sales</h1>
        <p className="text-muted-foreground text-lg">Detailed history of all completed Cash, Mobile Money, and Split Payment sales transactions.</p>
      </div>

      <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto pb-4 sm:pb-0">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Receipt ID</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Cashier</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posSales.map((sale) => (
                <TableRow key={sale.id} className="hover:bg-muted/50/50">
                  <TableCell className="font-mono text-sm">{sale.invoiceNo || sale.id.slice(0, 8).toUpperCase()}</TableCell>
                  <TableCell>
                    <p className="font-medium">{new Date(sale.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">{new Date(sale.createdAt).toLocaleTimeString()}</p>
                  </TableCell>
                  <TableCell>{sale.cashier.name || sale.cashier.email || sale.cashierId.slice(0, 8)}</TableCell>
                  <TableCell>{sale.customer?.name || 'Walk-in Retail'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 font-bold px-2 py-0.5 rounded uppercase border-0">
                      {sale.paymentMethod}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-black text-blue-600">GH₵{sale.totalAmount.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/receipt/${sale.id}`} className="text-sm font-bold text-blue-600 hover:text-blue-700">
                      View Receipt
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {posSales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                    No completed POS transactions recorded yet.
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
