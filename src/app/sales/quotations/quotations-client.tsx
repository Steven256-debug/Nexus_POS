'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  FileSpreadsheet, 
  Search, 
  ShoppingCart, 
  Truck, 
  CheckCircle, 
  CreditCard, 
  Banknote, 
  Smartphone,
  ExternalLink,
  Receipt,
  Clock,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { convertQuotationToSale } from '@/app/actions/deliveries';
import { useRouter } from 'next/navigation';

interface QuotationItem {
  id: string;
  quantity: number;
  priceAtSale: any;
  product: {
    id: string;
    name: string;
    sku: string;
    stockQuantity: number;
  };
}

interface Quotation {
  id: string;
  invoiceNo: string;
  totalAmount: any;
  status: string;
  paymentMethod: string;
  createdAt: Date | string;
  customer?: {
    id: string;
    name: string;
    phone?: string | null;
    group?: { name: string } | null;
  } | null;
  cashier: {
    name?: string | null;
    email?: string | null;
  };
  items: QuotationItem[];
}

export default function QuotationsClient({ initialQuotations }: { initialQuotations: Quotation[] }) {
  const router = useRouter();
  const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations);
  const [search, setSearch] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  // Convert modal form states
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MOBILE_MONEY' | 'CARD' | 'CREDIT'>('CASH');
  const [driverName, setDriverName] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [conversionNote, setConversionNote] = useState('');

  const filteredQuotations = quotations.filter((q) => {
    const query = search.toLowerCase();
    const inv = q.invoiceNo?.toLowerCase() || '';
    const cust = q.customer?.name?.toLowerCase() || '';
    const phone = q.customer?.phone?.toLowerCase() || '';
    return inv.includes(query) || cust.includes(query) || phone.includes(query);
  });

  const totalValue = filteredQuotations.reduce(
    (sum, q) => sum + Number(q.totalAmount),
    0
  );

  const handleOpenConvertModal = (quote: Quotation) => {
    setSelectedQuotation(quote);
    setPaymentMethod('CASH');
    setDriverName('');
    setVehicleNo('');
    setDeliveryAddress('');
    setConversionNote('');
    setIsConvertModalOpen(true);
  };

  const handleExecuteConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuotation) return;

    setIsConverting(true);
    try {
      const res = await convertQuotationToSale({
        quotationId: selectedQuotation.id,
        paymentMethod,
        driverName,
        vehicleNo,
        deliveryAddress,
        note: conversionNote,
      });

      if (res.success) {
        toast.success(`Quotation ${selectedQuotation.invoiceNo} successfully converted to Sale!`);
        setIsConvertModalOpen(false);
        // Remove converted quotation from active list
        setQuotations((prev) => prev.filter((q) => q.id !== selectedQuotation.id));
        router.push(`/waybill/${selectedQuotation.id}`);
      }
    } catch (err: any) {
      toast.error('Conversion failed: ' + err.message);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and KPI Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-foreground">
                Quotations & Pro-Forma Invoices
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Manage wholesale estimates, pro-forma invoices, and convert directly to sales & waybills.
              </p>
            </div>
          </div>
        </div>

        <Link href="/pos">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-md shadow-blue-500/20">
            <ShoppingCart className="w-4 h-4" /> New Quotation in POS
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-card text-card-foreground rounded-2xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Quotations</p>
            <h3 className="text-2xl font-black text-foreground mt-1">{quotations.length}</h3>
          </div>
          <span className="p-3 rounded-xl bg-amber-500/10 text-amber-600">
            <Clock className="w-5 h-5" />
          </span>
        </div>

        <div className="p-5 bg-card text-card-foreground rounded-2xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Quoted Value</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">GH₵{totalValue.toFixed(2)}</h3>
          </div>
          <span className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
            <Banknote className="w-5 h-5" />
          </span>
        </div>

        <div className="p-5 bg-card text-card-foreground rounded-2xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Dispatches & Waybills</p>
            <Link href="/sales/deliveries" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1 mt-1">
              View Deliveries <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <span className="p-3 rounded-xl bg-blue-500/10 text-blue-600">
            <Truck className="w-5 h-5" />
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by Quote / Invoice #, Customer, or Phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11 rounded-xl bg-card border-border shadow-sm text-sm"
        />
      </div>

      {/* Quotations Table */}
      <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Quote Ref</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Client / Contractor</TableHead>
                <TableHead>Cashier</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Quote Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotations.map((quote) => {
                const totalQty = quote.items.reduce((sum, it) => sum + it.quantity, 0);
                const hasOutOfStock = quote.items.some(
                  (it) => it.product.stockQuantity < it.quantity
                );

                return (
                  <TableRow key={quote.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono font-bold text-sm text-foreground">
                      {quote.invoiceNo || quote.id.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-xs text-foreground">
                        {new Date(quote.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(quote.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground">
                          {quote.customer?.name || 'Walk-In Customer'}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {quote.customer?.group && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-blue-500/10 text-blue-600 border-blue-500/20 font-bold">
                              {quote.customer.group.name}
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {quote.customer?.phone || 'No Phone'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-medium">
                      {quote.cashier?.name || quote.cashier?.email || 'Cashier'}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold">
                        {totalQty} units ({quote.items.length} line items)
                      </span>
                      {hasOutOfStock && (
                        <span className="block text-[10px] font-bold text-rose-500">
                          ⚠ Stock low for some items
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-black text-amber-600 text-base">
                      GH₵{Number(quote.totalAmount).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1. Quick Convert & Checkout Modal Button */}
                        <Button
                          size="sm"
                          onClick={() => handleOpenConvertModal(quote)}
                          className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-sm"
                          title="Convert directly to completed sale"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Convert to Sale
                        </Button>

                        {/* 2. Resume / Edit in POS */}
                        <Link href={`/pos?resume=${quote.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 text-blue-600 hover:bg-blue-50 font-bold text-xs rounded-lg flex items-center gap-1 border-blue-200"
                            title="Open and modify in POS terminal"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" /> POS
                          </Button>
                        </Link>

                        {/* 3. Waybill / Delivery Note */}
                        <Link href={`/waybill/${quote.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 text-zinc-700 hover:bg-zinc-100 font-bold text-xs rounded-lg flex items-center gap-1"
                            title="Generate and print Goods Waybill"
                          >
                            <Truck className="w-3.5 h-3.5 text-zinc-600" /> Waybill
                          </Button>
                        </Link>

                        {/* 4. Receipt / Pro-Forma View */}
                        <Link href={`/receipt/${quote.id}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-muted-foreground hover:text-foreground text-xs rounded-lg"
                            title="View Pro-Forma Invoice"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filteredQuotations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                    <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="font-bold text-base text-foreground">No quotations found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {search ? 'Try adjusting your search criteria.' : 'Create quotes in the POS terminal using "Quotation / Credit" checkout.'}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Quick Convert & Checkout Modal */}
      <Dialog open={isConvertModalOpen} onOpenChange={setIsConvertModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" /> Convert Quotation to Sale
            </DialogTitle>
          </DialogHeader>

          {selectedQuotation && (
            <form onSubmit={handleExecuteConvert} className="space-y-4 pt-2">
              <div className="p-3 bg-muted/40 rounded-xl border border-border text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quote Reference:</span>
                  <span className="font-bold font-mono">{selectedQuotation.invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-bold">{selectedQuotation.customer?.name || 'Walk-In'}</span>
                </div>
                <div className="flex justify-between text-sm pt-1 border-t border-border font-bold">
                  <span>Total Amount Due:</span>
                  <span className="text-emerald-600">GH₵{Number(selectedQuotation.totalAmount).toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
                  Payment Method *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'CASH', label: 'Cash', icon: Banknote },
                    { id: 'MOBILE_MONEY', label: 'MoMo', icon: Smartphone },
                    { id: 'CARD', label: 'Card / POS', icon: CreditCard },
                    { id: 'CREDIT', label: 'Credit Account', icon: Clock },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 font-bold text-xs transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                            : 'bg-card text-foreground border-border hover:bg-muted'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <span className="text-xs font-bold text-zinc-700 block mb-2 uppercase tracking-wider">
                  Logistics & Waybill Info (Optional)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5 block">
                      Driver / Carrier
                    </label>
                    <Input
                      placeholder="e.g. Kwame Mensah"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5 block">
                      Vehicle Reg No
                    </label>
                    <Input
                      placeholder="e.g. AS-4821-23"
                      value={vehicleNo}
                      onChange={(e) => setVehicleNo(e.target.value)}
                      className="rounded-xl h-9 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="mt-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5 block">
                    Delivery Address
                  </label>
                  <Input
                    placeholder="e.g. Suame Roundabout / Depot Site 4"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsConvertModalOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isConverting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl gap-1.5"
                >
                  {isConverting ? 'Processing Conversion...' : 'Confirm & Complete Sale'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
