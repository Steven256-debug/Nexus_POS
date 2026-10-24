import { getSales } from '@/app/actions/sales';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ReturnModal } from './return-modal';
import { Receipt, Calendar, ShoppingBag } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SalesPage() {
  const sales = await getSales();
  
  return (
    <div className="p-2 sm:p-4 md:p-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground mb-1 sm:mb-2">Sales History</h1>
        <p className="text-muted-foreground text-sm sm:text-lg">View past transactions and receipt copies.</p>
      </div>

      <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <Table className="min-w-[800px]">
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
                  <TableCell className="text-right font-bold text-blue-600">GH₵{sale.totalAmount.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-3">
                      <ReturnModal sale={sale as any} />
                      <Link href={`/receipt/${sale.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                        View Receipt
                      </Link>
                    </div>
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

        {/* Mobile Cards View */}
        <div className="block sm:hidden divide-y divide-border">
          {sales.map((sale) => {
            const itemCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
            return (
              <div key={sale.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-blue-600" />
                    <span className="font-mono text-xs font-bold text-foreground">
                      #{sale.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs uppercase font-semibold">
                    {sale.paymentMethod}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(sale.createdAt).toLocaleDateString()} {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                  </div>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-xs text-muted-foreground">Total Paid:</span>
                  <span className="text-lg font-black text-blue-600">
                    GH₵{sale.totalAmount.toFixed(2)}
                  </span>
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                  <ReturnModal sale={sale as any} />
                  <Link
                    href={`/receipt/${sale.id}`}
                    className="inline-flex items-center justify-center text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-lg hover:bg-blue-100"
                  >
                    View Receipt
                  </Link>
                </div>
              </div>
            );
          })}

          {sales.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No sales recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
