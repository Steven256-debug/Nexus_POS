export type DispatchStatus = 'PENDING_DISPATCH' | 'IN_TRANSIT' | 'DELIVERED' | 'COLLECTED';

export interface DispatchInfo {
  status: DispatchStatus;
  waybillNo: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNo?: string;
  deliveryAddress?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  receivedBy?: string;
  notes?: string;
}

export function generateDefaultWaybillNo(saleId: string, invoiceNo?: string): string {
  if (invoiceNo && invoiceNo.startsWith('INV-')) {
    return invoiceNo.replace('INV-', 'WB-');
  }
  return `WB-${saleId.slice(0, 8).toUpperCase()}`;
}

export function parseSaleDispatch(
  note: string | null | undefined,
  saleId: string,
  invoiceNo?: string
): { customerNote: string; dispatch: DispatchInfo } {
  const defaultWaybill = generateDefaultWaybillNo(saleId, invoiceNo);

  if (!note) {
    return {
      customerNote: '',
      dispatch: {
        status: 'PENDING_DISPATCH',
        waybillNo: defaultWaybill,
      },
    };
  }

  // Attempt JSON parsing (structured note)
  try {
    if (note.trim().startsWith('{') && note.trim().endsWith('}')) {
      const parsed = JSON.parse(note);
      if (parsed && typeof parsed === 'object') {
        const dispatchObj = parsed.dispatch || {};
        return {
          customerNote: parsed.customerNote || '',
          dispatch: {
            status: dispatchObj.status || 'PENDING_DISPATCH',
            waybillNo: dispatchObj.waybillNo || defaultWaybill,
            driverName: dispatchObj.driverName || '',
            driverPhone: dispatchObj.driverPhone || '',
            vehicleNo: dispatchObj.vehicleNo || '',
            deliveryAddress: dispatchObj.deliveryAddress || '',
            dispatchedAt: dispatchObj.dispatchedAt || undefined,
            deliveredAt: dispatchObj.deliveredAt || undefined,
            receivedBy: dispatchObj.receivedBy || '',
            notes: dispatchObj.notes || '',
          },
        };
      }
    }
  } catch {
    // fallback to regex match
  }

  // Attempt bracket tag parsing: [DISPATCH:{...}]
  const match = note.match(/\[DISPATCH:(.*?)\]/);
  if (match) {
    try {
      const dispatchObj = JSON.parse(match[1]);
      const customerNote = note.replace(/\[DISPATCH:.*?\]/, '').trim();
      return {
        customerNote,
        dispatch: {
          status: dispatchObj.status || 'PENDING_DISPATCH',
          waybillNo: dispatchObj.waybillNo || defaultWaybill,
          driverName: dispatchObj.driverName || '',
          driverPhone: dispatchObj.driverPhone || '',
          vehicleNo: dispatchObj.vehicleNo || '',
          deliveryAddress: dispatchObj.deliveryAddress || '',
          dispatchedAt: dispatchObj.dispatchedAt || undefined,
          deliveredAt: dispatchObj.deliveredAt || undefined,
          receivedBy: dispatchObj.receivedBy || '',
          notes: dispatchObj.notes || '',
        },
      };
    } catch {
      // ignore
    }
  }

  return {
    customerNote: note,
    dispatch: {
      status: 'PENDING_DISPATCH',
      waybillNo: defaultWaybill,
    },
  };
}

export function serializeSaleNote(customerNote: string | undefined, dispatch: DispatchInfo): string {
  return JSON.stringify({
    customerNote: customerNote || '',
    dispatch,
  });
}
