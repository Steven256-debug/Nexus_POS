'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Truck, 
  Search, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  Printer, 
  Edit3, 
  MapPin, 
  Phone, 
  Receipt, 
  FileText,
  Filter,
  Package
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { updateDispatchStatus } from '@/app/actions/deliveries';
import type { DispatchStatus, DispatchInfo } from '@/lib/dispatch-utils';

interface DeliverySale {
  id: string;
  invoiceNo: string;
  status: string;
  totalAmount: number;
  createdAt: string | Date;
  customerNote?: string;
  customer?: {
    id: string;
    name: string;
    phone?: string | null;
    address?: string | null;
    group?: { name: string } | null;
  } | null;
  cashier?: {
    name?: string | null;
    email?: string | null;
  } | null;
  items: Array<{
    id: string;
    quantity: number;
    priceAtSale: number;
    product: {
      name: string;
      sku: string;
      unit?: { shortName: string } | null;
    };
  }>;
  dispatch: DispatchInfo;
}

export default function DeliveriesClient({ initialSales }: { initialSales: DeliverySale[] }) {
  const [sales, setSales] = useState<DeliverySale[]>(initialSales);
  const [search, setSearch] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Edit Dispatch Dialog states
  const [selectedSale, setSelectedSale] = useState<DeliverySale | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [editStatus, setEditStatus] = useState<DispatchStatus>('PENDING_DISPATCH');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [logisticsNotes, setLogisticsNotes] = useState('');

  const filteredSales = sales.filter((s) => {
    // Status filter
    if (selectedStatusFilter !== 'ALL' && s.dispatch.status !== selectedStatusFilter) {
      return false;
    }
    // Search query filter
    const query = search.toLowerCase();
    const inv = s.invoiceNo?.toLowerCase() || '';
    const wb = s.dispatch.waybillNo?.toLowerCase() || '';
    const cust = s.customer?.name?.toLowerCase() || '';
    const driver = s.dispatch.driverName?.toLowerCase() || '';
    const veh = s.dispatch.vehicleNo?.toLowerCase() || '';
    return inv.includes(query) || wb.includes(query) || cust.includes(query) || driver.includes(query) || veh.includes(query);
  });

  const countPending = sales.filter((s) => s.dispatch.status === 'PENDING_DISPATCH').length;
  const countInTransit = sales.filter((s) => s.dispatch.status === 'IN_TRANSIT').length;
  const countDelivered = sales.filter((s) => s.dispatch.status === 'DELIVERED').length;
  const countCollected = sales.filter((s) => s.dispatch.status === 'COLLECTED').length;

  const handleOpenEdit = (sale: DeliverySale) => {
    setSelectedSale(sale);
    setEditStatus(sale.dispatch.status || 'PENDING_DISPATCH');
    setDriverName(sale.dispatch.driverName || '');
    setDriverPhone(sale.dispatch.driverPhone || '');
    setVehicleNo(sale.dispatch.vehicleNo || '');
    setDeliveryAddress(sale.dispatch.deliveryAddress || sale.customer?.address || '');
    setReceivedBy(sale.dispatch.receivedBy || '');
    setLogisticsNotes(sale.dispatch.notes || '');
    setIsEditOpen(true);
  };

  const handleSaveDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale) return;

    setIsUpdating(true);
    try {
      const res = await updateDispatchStatus({
        saleId: selectedSale.id,
        status: editStatus,
        driverName,
        driverPhone,
        vehicleNo,
        deliveryAddress,
        receivedBy,
        notes: logisticsNotes,
      });

      if (res.success) {
        toast.success(`Waybill ${res.dispatch.waybillNo} updated to ${editStatus.replace('_', ' ')}!`);
        setSales((prev) =>
          prev.map((s) =>
            s.id === selectedSale.id ? { ...s, dispatch: res.dispatch } : s
          )
        );
        setIsEditOpen(false);
      }
    } catch (err: any) {
      toast.error('Failed to update dispatch: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const statusBadge = (st: DispatchStatus) => {
    switch (st) {
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
          </span>
        );
      case 'COLLECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-200">
            <UserCheck className="w-3.5 h-3.5" /> Self-Pickup
          </span>
        );
      case 'IN_TRANSIT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200 animate-pulse">
            <Truck className="w-3.5 h-3.5" /> In Transit
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Pending Dispatch
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/10 text-blue-600 rounded-2xl">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-foreground">
                Deliveries & Goods Waybills
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Track order dispatches, assign transit drivers & vehicles, and print official consignment waybills.
              </p>
            </div>
          </div>
        </div>

        <Link href="/sales/quotations">
          <Button variant="outline" className="rounded-xl font-bold flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-600" /> Quotations Ledger
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div 
          onClick={() => setSelectedStatusFilter('ALL')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            selectedStatusFilter === 'ALL'
              ? 'bg-card text-foreground border-blue-600 shadow-md ring-2 ring-blue-500/20'
              : 'bg-card text-muted-foreground border-border hover:bg-muted/40'
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Shipments</p>
          <h3 className="text-2xl font-black text-foreground mt-1">{sales.length}</h3>
        </div>

        <div 
          onClick={() => setSelectedStatusFilter('PENDING_DISPATCH')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            selectedStatusFilter === 'PENDING_DISPATCH'
              ? 'bg-amber-50 text-amber-900 border-amber-500 shadow-md ring-2 ring-amber-500/20'
              : 'bg-card text-muted-foreground border-border hover:bg-muted/40'
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Dispatch</p>
          <h3 className="text-2xl font-black text-amber-600 mt-1">{countPending}</h3>
        </div>

        <div 
          onClick={() => setSelectedStatusFilter('IN_TRANSIT')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            selectedStatusFilter === 'IN_TRANSIT'
              ? 'bg-blue-50 text-blue-900 border-blue-500 shadow-md ring-2 ring-blue-500/20'
              : 'bg-card text-muted-foreground border-border hover:bg-muted/40'
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">In Transit</p>
          <h3 className="text-2xl font-black text-blue-600 mt-1">{countInTransit}</h3>
        </div>

        <div 
          onClick={() => setSelectedStatusFilter('DELIVERED')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            selectedStatusFilter === 'DELIVERED'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
              : 'bg-card text-muted-foreground border-border hover:bg-muted/40'
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Delivered</p>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">{countDelivered}</h3>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by Waybill #, Invoice #, Customer, Driver, Vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-card border-border shadow-sm text-sm"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { id: 'ALL', label: 'All Status' },
            { id: 'PENDING_DISPATCH', label: 'Pending' },
            { id: 'IN_TRANSIT', label: 'In Transit' },
            { id: 'DELIVERED', label: 'Delivered' },
            { id: 'COLLECTED', label: 'Self-Pickup' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedStatusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[950px]">
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Waybill Ref</TableHead>
                <TableHead>Inv / Quote Ref</TableHead>
                <TableHead>Consignee / Customer</TableHead>
                <TableHead>Transporter & Vehicle</TableHead>
                <TableHead>Packages</TableHead>
                <TableHead>Dispatch Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map((sale) => {
                const totalUnits = sale.items.reduce((sum, it) => sum + it.quantity, 0);

                return (
                  <TableRow key={sale.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono font-bold text-sm text-foreground">
                      <Link href={`/waybill/${sale.id}`} className="text-blue-600 hover:underline flex items-center gap-1">
                        {sale.dispatch.waybillNo}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground font-semibold">
                      {sale.invoiceNo}
                      {sale.status === 'QUOTATION' && (
                        <Badge variant="outline" className="ml-1.5 text-[9px] px-1 py-0 text-amber-600 border-amber-300">
                          Quote
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground">
                          {sale.customer?.name || 'Walk-In Customer'}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                          <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                          <span className="truncate max-w-[200px]">
                            {sale.dispatch.deliveryAddress || sale.customer?.address || 'Store Pickup'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <p className="font-semibold text-foreground">
                          {sale.dispatch.driverName || 'Unassigned Driver'}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {sale.dispatch.vehicleNo || 'No Vehicle Reg'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-xs text-foreground">
                        {totalUnits} units
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        ({sale.items.length} items)
                      </span>
                    </TableCell>
                    <TableCell>
                      {statusBadge(sale.dispatch.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1. Print Waybill */}
                        <Link href={`/waybill/${sale.id}`}>
                          <Button
                            size="sm"
                            className="h-8 px-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-sm"
                            title="Open and print Goods Waybill"
                          >
                            <Printer className="w-3.5 h-3.5" /> Waybill
                          </Button>
                        </Link>

                        {/* 2. Update Dispatch Status */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(sale)}
                          className="h-8 px-2.5 font-bold text-xs rounded-lg flex items-center gap-1"
                          title="Assign driver or change delivery status"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-zinc-600" /> Update
                        </Button>

                        {/* 3. View Receipt */}
                        <Link href={`/receipt/${sale.id}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-muted-foreground hover:text-foreground text-xs rounded-lg"
                            title="View Receipt"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filteredSales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                    <Truck className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="font-bold text-base text-foreground">No shipments or waybills found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {search ? 'Try clearing your search query.' : 'Sales and Quotations automatically register a waybill for dispatch tracking.'}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Update Dispatch Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" /> Update Dispatch & Waybill
            </DialogTitle>
          </DialogHeader>

          {selectedSale && (
            <form onSubmit={handleSaveDispatch} className="space-y-4 pt-2">
              <div className="p-3 bg-muted/40 rounded-xl border border-border text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Waybill No:</span>
                  <span className="font-bold font-mono text-blue-600">{selectedSale.dispatch.waybillNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice Reference:</span>
                  <span className="font-bold font-mono">{selectedSale.invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Consignee:</span>
                  <span className="font-bold">{selectedSale.customer?.name || 'Walk-In'}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
                  Delivery Status *
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as DispatchStatus)}
                  className="w-full h-11 px-3 rounded-xl border border-border bg-card text-foreground font-semibold"
                >
                  <option value="PENDING_DISPATCH">Pending Dispatch (Packed at warehouse)</option>
                  <option value="IN_TRANSIT">In Transit (Out for delivery)</option>
                  <option value="DELIVERED">Delivered (Received by customer)</option>
                  <option value="COLLECTED">Collected / Self-Pickup</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
                    Driver / Carrier
                  </label>
                  <Input
                    placeholder="e.g. Kwame Mensah"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="rounded-xl h-11"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
                    Vehicle Reg No
                  </label>
                  <Input
                    placeholder="e.g. AS-4821-23"
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value)}
                    className="rounded-xl h-11 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
                    Driver Phone
                  </label>
                  <Input
                    placeholder="e.g. 0244123456"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="rounded-xl h-11"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
                    Received By (Signee)
                  </label>
                  <Input
                    placeholder="Recipient's Name"
                    value={receivedBy}
                    onChange={(e) => setReceivedBy(e.target.value)}
                    className="rounded-xl h-11"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
                  Delivery Site Address
                </label>
                <Input
                  placeholder="e.g. Suame Roundabout / Depot Site 4"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
                  Logistics Notes
                </label>
                <Input
                  placeholder="e.g. Deliver before 4:00 PM, inspect carton seals"
                  value={logisticsNotes}
                  onChange={(e) => setLogisticsNotes(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                >
                  {isUpdating ? 'Saving...' : 'Update Dispatch'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
