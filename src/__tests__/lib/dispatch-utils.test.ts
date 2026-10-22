import {
  generateDefaultWaybillNo,
  parseSaleDispatch,
  serializeSaleNote,
  DispatchInfo,
} from '@/lib/dispatch-utils';

describe('Dispatch & Waybill Utilities', () => {
  describe('generateDefaultWaybillNo', () => {
    it('generates waybill from invoice number replacing INV- with WB-', () => {
      expect(generateDefaultWaybillNo('sale-1234', 'INV-2026-0042')).toBe('WB-2026-0042');
    });

    it('falls back to sale ID prefix if invoice number is not provided', () => {
      expect(generateDefaultWaybillNo('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe('WB-A1B2C3D4');
    });
  });

  describe('parseSaleDispatch', () => {
    it('handles null note gracefully with default values', () => {
      const { customerNote, dispatch } = parseSaleDispatch(null, 'sale-999', 'INV-2026-0001');
      expect(customerNote).toBe('');
      expect(dispatch.status).toBe('PENDING_DISPATCH');
      expect(dispatch.waybillNo).toBe('WB-2026-0001');
    });

    it('handles plain string note preserving it as customerNote', () => {
      const { customerNote, dispatch } = parseSaleDispatch('Please deliver before 2pm', 'sale-999', 'INV-2026-0001');
      expect(customerNote).toBe('Please deliver before 2pm');
      expect(dispatch.status).toBe('PENDING_DISPATCH');
      expect(dispatch.waybillNo).toBe('WB-2026-0001');
    });

    it('correctly parses structured JSON notes', () => {
      const dispatchData: DispatchInfo = {
        status: 'IN_TRANSIT',
        waybillNo: 'WB-2026-9999',
        driverName: 'Kwame Mensah',
        driverPhone: '0244123456',
        vehicleNo: 'AS-4821-23',
        deliveryAddress: 'Kumasi Depot Site A',
        notes: 'Handle with care',
      };
      const noteStr = serializeSaleNote('Urgent wholesale order', dispatchData);

      const parsed = parseSaleDispatch(noteStr, 'sale-999', 'INV-2026-0001');
      expect(parsed.customerNote).toBe('Urgent wholesale order');
      expect(parsed.dispatch.status).toBe('IN_TRANSIT');
      expect(parsed.dispatch.waybillNo).toBe('WB-2026-9999');
      expect(parsed.dispatch.driverName).toBe('Kwame Mensah');
      expect(parsed.dispatch.vehicleNo).toBe('AS-4821-23');
    });

    it('correctly parses legacy bracket tag format [DISPATCH:{...}]', () => {
      const tagNote = 'Deliver to site [DISPATCH:{"status":"DELIVERED","driverName":"Kofi","receivedBy":"Mr. Amoako"}]';
      const parsed = parseSaleDispatch(tagNote, 'sale-999', 'INV-2026-0001');
      expect(parsed.customerNote).toBe('Deliver to site');
      expect(parsed.dispatch.status).toBe('DELIVERED');
      expect(parsed.dispatch.driverName).toBe('Kofi');
      expect(parsed.dispatch.receivedBy).toBe('Mr. Amoako');
    });
  });

  describe('serializeSaleNote', () => {
    it('serializes customer note and dispatch data to valid JSON string', () => {
      const dispatch: DispatchInfo = {
        status: 'DELIVERED',
        waybillNo: 'WB-1234',
      };
      const serialized = serializeSaleNote('Customer note', dispatch);
      expect(typeof serialized).toBe('string');
      const parsed = JSON.parse(serialized);
      expect(parsed.customerNote).toBe('Customer note');
      expect(parsed.dispatch.status).toBe('DELIVERED');
    });
  });
});
