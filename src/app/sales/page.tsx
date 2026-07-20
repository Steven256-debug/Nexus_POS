import { getSales } from '@/app/actions/sales';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SalesPage() {
  const sales = await getSales();
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">Sales History</h1>
        <p className="text-muted-foreground text-lg">View past transactions and receipt copies.</p>
      </div>

      <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Receipt ID</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Cashier</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id} className="hover:bg-muted/50/50">
                <TableCell className="font-mono text-sm">{sale.id.slice(0, 8).toUpperCase()}</TableCell>
                <TableCell>
                  <p className="font-medium">{new Date(sale.createdAt).toLocaleDateString()}</p>
                  <p className="text-xs text-muted-foreground">{new Date(sale.createdAt).toLocaleTimeString()}</p>
                </TableCell>
                <TableCell>{sale.cashierId.slice(0, 8)}</TableCell>
                <TableCell>{sale.items.reduce((sum, item) => sum + item.quantity, 0)} items</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-muted">{sale.paymentMethod}</Badge>
                </TableCell>
                <TableCell className="text-right font-bold text-blue-600">${sale.totalAmount.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/receipt/${sale.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    View Receipt
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {sales.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No sales recorded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
