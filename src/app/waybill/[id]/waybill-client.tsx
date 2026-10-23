'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Printer, 
  ArrowLeft, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Package, 
  Eye, 
  EyeOff, 
  Edit3,
  MapPin,
  Phone,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { updateDispatchStatus } from '@/app/actions/deliveries';
import type { DispatchStatus, DispatchInfo } from '@/lib/dispatch-utils';

interface WaybillClientProps {
  sale: any;
  settings: Record<string, string>;
}

export default function WaybillClient({ sale, settings }: WaybillClientProps) {
  const [showPrices, setShowPrices] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [currentDispatch, setCurrentDispatch] = useState<DispatchInfo>(sale.dispatch);

  // Form states for dispatch update
  const [status, setStatus] = useState<DispatchStatus>(sale.dispatch.status || 'PENDING_DISPATCH');
  const [driverName, setDriverName] = useState(sale.dispatch.driverName || '');
  const [driverPhone, setDriverPhone] = useState(sale.dispatch.driverPhone || '');
  const [vehicleNo, setVehicleNo] = useState(sale.dispatch.vehicleNo || '');
  const [deliveryAddress, setDeliveryAddress] = useState(
    sale.dispatch.deliveryAddress || sale.customer?.address || ''
  );
  const [receivedBy, setReceivedBy] = useState(sale.dispatch.receivedBy || '');
  const [notes, setNotes] = useState(sale.dispatch.notes || '');

  const businessName = settings.business_name || 'ANNA POS';
  const currency = settings.currency || 'GH₵';

  const handlePrint = () => {
    try {
      window.print();
    } catch (err: any) {
      toast.error('Printer connection failed: ' + err.message);
    }
  };

  const handleSaveDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await updateDispatchStatus({
        saleId: sale.id,
        status,
        driverName,
        driverPhone,
        vehicleNo,
        deliveryAddress,
        notes,
        receivedBy,
      });

      if (res.success) {
        setCurrentDispatch(res.dispatch);
        toast.success(`Dispatch status updated to: ${status.replace('_', ' ')}`);
        setIsUpdateOpen(false);
      }
    } catch (err: any) {
      toast.error('Failed to update dispatch: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const totalQuantity = sale.items.reduce((sum: number, item: any) => sum + item.quantity, 0);

  const statusBadge = (st: DispatchStatus) => {
    switch (st) {
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 print:border-black print:text-black">
            <CheckCircle2 className="w-3.5 h-3.5" /> DELIVERED
          </span>
        );
      case 'COLLECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-300 print:border-black print:text-black">
            <UserCheck className="w-3.5 h-3.5" /> COLLECTED / PICKUP
          </span>
        );
      case 'IN_TRANSIT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-300 print:border-black print:text-black">
            <Truck className="w-3.5 h-3.5" /> IN TRANSIT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 print:border-black print:text-black">
            <Clock className="w-3.5 h-3.5" /> PENDING DISPATCH
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 py-8 px-4 print:bg-white print:p-0 print:m-0 text-foreground">
      
      {/* Action Bar (Hidden on print) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <Link href="/sales/deliveries">
            <Button variant="outline" size="sm" className="rounded-xl font-bold">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Deliveries
            </Button>
          </Link>
          <Link href="/sales/quotations">
            <Button variant="ghost" size="sm" className="rounded-xl font-medium text-muted-foreground">
              Quotations
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPrices(!showPrices)}
            className="rounded-xl font-semibold gap-1.5"
          >
            {showPrices ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPrices ? 'Hide Pricing (Blind Waybill)' : 'Show Pricing'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsUpdateOpen(true)}
            className="rounded-xl font-semibold gap-1.5 bg-card"
          >
            <Edit3 className="w-4 h-4 text-blue-600" />
            Update Status & Driver
          </Button>

          <Button
            size="sm"
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 gap-1.5"
          >
            <Printer className="w-4 h-4" /> Print Waybill
          </Button>
        </div>
      </div>

      {/* Waybill Document Paper */}
      <div className="max-w-4xl mx-auto bg-white text-zinc-900 border border-zinc-300 rounded-2xl shadow-xl print:shadow-none print:border-none print:rounded-none p-8 md:p-12 print:p-4 font-sans">
        
        {/* Document Header */}
        <div className="border-b-2 border-zinc-900 pb-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white font-black text-xl flex items-center justify-center print:border print:border-black">
                  FA
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight uppercase leading-none">
                    {businessName}
                  </h1>
                  <p className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mt-0.5">
                    General Wholesale & Retail Merchant
                  </p>
                </div>
              </div>
              <div className="text-xs text-zinc-600 mt-3 space-y-0.5">
                <p>Location: Kumasi Central Market / Greater Kumasi, Ghana</p>
                <p>Tel: +233 (0) 24 000 0000 / +233 (0) 50 000 0000</p>
                <p>Email: sales@annapos.com</p>
              </div>
            </div>

            <div className="text-left md:text-right bg-zinc-50 print:bg-transparent p-4 rounded-xl border border-zinc-200 print:border-none">
              <div className="inline-block px-3 py-1 bg-zinc-900 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-md mb-2 print:border print:border-black print:text-black print:bg-white">
                OFFICIAL GOODS WAYBILL
              </div>
              <p className="text-sm font-black text-zinc-900 font-mono">
                {currentDispatch.waybillNo}
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                Ref Inv/Quote: <span className="font-mono font-bold">{sale.invoiceNo}</span>
              </p>
              <p className="text-xs text-zinc-600">
                Date: {new Date(sale.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
              <div className="mt-2">{statusBadge(currentDispatch.status)}</div>
            </div>
          </div>
        </div>

        {/* Consignee & Dispatch Logistics Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Customer / Consignee */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 print:bg-transparent">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-700 flex items-center gap-1.5 mb-2">
              <Package className="w-3.5 h-3.5 text-blue-600" /> Consignee / Deliver To
            </h3>
            <p className="text-base font-bold text-zinc-900">
              {sale.customer?.name || 'Walk-In Customer / Retail Client'}
            </p>
            {sale.customer?.group && (
              <span className="inline-block mt-0.5 text-[11px] font-bold text-blue-700 uppercase bg-blue-50 px-2 py-0.5 rounded border border-blue-200 print:border-none print:p-0">
                Pricing Tier: {sale.customer.group.name}
              </span>
            )}
            <div className="mt-2 text-xs text-zinc-600 space-y-1">
              <p className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-zinc-400" />
                {sale.customer?.phone || 'No phone on file'}
              </p>
              <p className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                {currentDispatch.deliveryAddress || sale.customer?.address || 'Premises / On-Site Collection'}
              </p>
            </div>
          </div>

          {/* Transport & Carrier Details */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 print:bg-transparent">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-700 flex items-center gap-1.5 mb-2">
              <Truck className="w-3.5 h-3.5 text-blue-600" /> Transporter & Dispatch Details
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-zinc-500 block">Driver / Carrier:</span>
                <span className="font-bold text-zinc-900">
                  {currentDispatch.driverName || 'Self / Company Driver'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">Vehicle Reg No:</span>
                <span className="font-bold text-zinc-900 font-mono">
                  {currentDispatch.vehicleNo || 'Direct Handover'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">Driver Contact:</span>
                <span className="font-bold text-zinc-900">
                  {currentDispatch.driverPhone || '—'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">Issuing Officer:</span>
                <span className="font-bold text-zinc-900">
                  {sale.cashier?.name || sale.cashier?.email || 'Storekeeper'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Itemized Goods Manifest Table */}
        <div className="mb-6 overflow-x-auto">
          <table className="w-full border-collapse border border-zinc-300 text-xs">
            <thead>
              <tr className="bg-zinc-100 print:bg-zinc-200 text-zinc-900 font-bold uppercase tracking-wider text-[11px] border-b border-zinc-300">
                <th className="p-2.5 text-center w-12 border-r border-zinc-300">#</th>
                <th className="p-2.5 text-left w-28 border-r border-zinc-300">SKU / Code</th>
                <th className="p-2.5 text-left border-r border-zinc-300">Item Description</th>
                <th className="p-2.5 text-center w-24 border-r border-zinc-300">Unit / Pack</th>
                <th className="p-2.5 text-right w-24 border-r border-zinc-300">Qty Dispatched</th>
                <th className="p-2.5 text-center w-24 border-r border-zinc-300">Qty Received</th>
                {showPrices && (
                  <>
                    <th className="p-2.5 text-right w-24 border-r border-zinc-300">Unit Price</th>
                    <th className="p-2.5 text-right w-24">Total</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item: any, idx: number) => (
                <tr key={item.id} className="border-b border-zinc-200 hover:bg-zinc-50">
                  <td className="p-2.5 text-center font-mono font-bold text-zinc-500 border-r border-zinc-200">
                    {idx + 1}
                  </td>
                  <td className="p-2.5 font-mono text-zinc-700 font-semibold border-r border-zinc-200">
                    {item.product?.sku || '—'}
                  </td>
                  <td className="p-2.5 font-bold text-zinc-900 border-r border-zinc-200">
                    <div>{item.product?.name || 'Item'}</div>
                    {item.product?.category && (
                      <span className="text-[10px] text-zinc-500 font-normal">
                        Category: {item.product.category.name}
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-center text-zinc-700 border-r border-zinc-200 font-semibold">
                    {item.product?.unit?.shortName || item.product?.unit?.name || 'Pc(s)'}
                  </td>
                  <td className="p-2.5 text-right font-black text-sm text-zinc-900 border-r border-zinc-200">
                    {item.quantity}
                  </td>
                  <td className="p-2.5 text-center border-r border-zinc-200">
                    {/* Blank check box for receiver tally */}
                    <div className="w-12 h-6 border border-zinc-400 rounded mx-auto flex items-center justify-center font-bold text-zinc-400">
                      [ &nbsp; ]
                    </div>
                  </td>
                  {showPrices && (
                    <>
                      <td className="p-2.5 text-right font-mono text-zinc-700 border-r border-zinc-200">
                        {currency}{item.priceAtSale.toFixed(2)}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-zinc-900">
                        {currency}{(item.priceAtSale * item.quantity).toFixed(2)}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-zinc-50 print:bg-zinc-100 font-bold border-t-2 border-zinc-400">
                <td colSpan={4} className="p-3 text-right uppercase tracking-wider text-xs border-r border-zinc-300">
                  Total Items / Packages Dispatched:
                </td>
                <td className="p-3 text-right text-sm font-black border-r border-zinc-300">
                  {totalQuantity}
                </td>
                <td className="p-3 text-center border-r border-zinc-300 text-xs text-zinc-500">
                  Checked By [ &nbsp; ]
                </td>
                {showPrices && (
                  <td colSpan={2} className="p-3 text-right text-sm font-black text-blue-700">
                    {currency}{sale.totalAmount.toFixed(2)}
                  </td>
                )}
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Special Instructions & Notes */}
        {(sale.customerNote || currentDispatch.notes) && (
          <div className="p-3 mb-6 bg-zinc-50 rounded-xl border border-dashed border-zinc-300 text-xs text-zinc-700">
            <span className="font-bold block mb-0.5 uppercase tracking-wider text-zinc-500 text-[10px]">
              Delivery Instructions / Remarks:
            </span>
            <p>{currentDispatch.notes || sale.customerNote}</p>
          </div>
        )}

        {/* Terms of Delivery */}
        <div className="text-[11px] text-zinc-500 mb-8 space-y-1 border-t border-zinc-200 pt-3">
          <p className="font-bold text-zinc-700 uppercase tracking-wider text-[10px]">
            Delivery & Acceptance Conditions:
          </p>
          <p>
            1. Consignee must inspect all goods, quantities, and packaging seal integrity upon handover.
          </p>
          <p>
            2. Any discrepancies, damages, or missing packages must be endorsed on this document before the carrier departs.
          </p>
          <p>
            3. Goods signed for without written endorsement shall be deemed complete and in good merchantable condition.
          </p>
        </div>

        {/* Triple Official Sign-off Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t-2 border-zinc-900">
          {/* 1. Warehouse Officer */}
          <div className="space-y-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-zinc-800">
                1. Dispatched By (Store/Warehouse)
              </p>
              <p className="text-[10px] text-zinc-500">Goods released in good condition</p>
            </div>
            <div className="border-b border-dashed border-zinc-400 h-10"></div>
            <div className="text-xs space-y-1">
              <p className="text-zinc-600">Name: <span className="font-bold text-zinc-900">{sale.cashier?.name || 'Authorized Officer'}</span></p>
              <p className="text-zinc-600">Date: <span className="font-bold text-zinc-900">{new Date().toLocaleDateString('en-GB')}</span></p>
            </div>
          </div>

          {/* 2. Carrier / Driver */}
          <div className="space-y-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-zinc-800">
                2. Carrier / Driver Handover
              </p>
              <p className="text-[10px] text-zinc-500">Received for onward transit</p>
            </div>
            <div className="border-b border-dashed border-zinc-400 h-10"></div>
            <div className="text-xs space-y-1">
              <p className="text-zinc-600">Name: <span className="font-bold text-zinc-900">{currentDispatch.driverName || 'Carrier Representative'}</span></p>
              <p className="text-zinc-600">Vehicle: <span className="font-bold text-zinc-900">{currentDispatch.vehicleNo || '—'}</span></p>
            </div>
          </div>

          {/* 3. Customer / Consignee */}
          <div className="space-y-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-zinc-800">
                3. Customer / Receiver Acceptance
              </p>
              <p className="text-[10px] text-zinc-500">Received in good order & condition</p>
            </div>
            <div className="border-b border-dashed border-zinc-400 h-10"></div>
            <div className="text-xs space-y-1">
              <p className="text-zinc-600">Name: <span className="font-bold text-zinc-900">{currentDispatch.receivedBy || '...........................................'}</span></p>
              <p className="text-zinc-600">Date & Stamp: <span className="font-bold text-zinc-900">...................................</span></p>
            </div>
          </div>
        </div>

        {/* Footer Barcode line */}
        <div className="mt-8 pt-4 border-t border-dashed border-zinc-300 flex justify-between items-center text-[10px] text-zinc-400 font-mono">
          <span>NEXUS POS WAYBILL SYSTEM — {businessName}</span>
          <span>WAYBILL ID: {sale.id}</span>
        </div>
      </div>

      {/* Update Dispatch Status Modal */}
      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" /> Update Dispatch & Logistics
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveDispatch} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
                Dispatch Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DispatchStatus)}
                className="w-full h-11 px-3 rounded-xl border border-border bg-card text-foreground font-semibold"
              >
                <option value="PENDING_DISPATCH">Pending Dispatch</option>
                <option value="IN_TRANSIT">In Transit (Out for Delivery)</option>
                <option value="DELIVERED">Delivered (Customer Confirmed)</option>
                <option value="COLLECTED">Collected / Self Pickup</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
                  Driver Name
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
                  Received By (If delivered)
                </label>
                <Input
                  placeholder="Receiver's Name"
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
                placeholder="e.g. Call client 30 mins prior to arrival"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-xl h-11"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUpdateOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
              >
                {isUpdating ? 'Saving...' : 'Save Dispatch Info'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
