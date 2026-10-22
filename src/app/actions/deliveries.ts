'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/action-utils';
import { logAction } from '@/lib/audit';
import {
  parseSaleDispatch,
  serializeSaleNote,
  DispatchStatus,
  DispatchInfo,
  generateDefaultWaybillNo,
} from '@/lib/dispatch-utils';

export interface UpdateDispatchInput {
  saleId: string;
  status: DispatchStatus;
  waybillNo?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNo?: string;
  deliveryAddress?: string;
  notes?: string;
  receivedBy?: string;
}

export async function updateDispatchStatus(input: UpdateDispatchInput) {
  const user = await requireAuth();

  const sale = await prisma.sale.findUnique({
    where: { id: input.saleId },
    select: {
      id: true,
      invoiceNo: true,
      note: true,
      customerId: true,
      customer: { select: { name: true } },
    },
  });

  if (!sale) {
    throw new Error('Transaction record not found');
  }

  const { customerNote, dispatch: currentDispatch } = parseSaleDispatch(
    sale.note,
    sale.id,
    sale.invoiceNo
  );

  const now = new Date().toISOString();
  const updatedDispatch: DispatchInfo = {
    ...currentDispatch,
    status: input.status,
    waybillNo: input.waybillNo || currentDispatch.waybillNo || generateDefaultWaybillNo(sale.id, sale.invoiceNo),
    driverName: input.driverName ?? currentDispatch.driverName,
    driverPhone: input.driverPhone ?? currentDispatch.driverPhone,
    vehicleNo: input.vehicleNo ?? currentDispatch.vehicleNo,
    deliveryAddress: input.deliveryAddress ?? currentDispatch.deliveryAddress,
    notes: input.notes ?? currentDispatch.notes,
    receivedBy: input.receivedBy ?? currentDispatch.receivedBy,
    dispatchedAt:
      input.status === 'IN_TRANSIT' && !currentDispatch.dispatchedAt
        ? now
        : currentDispatch.dispatchedAt,
    deliveredAt:
      (input.status === 'DELIVERED' || input.status === 'COLLECTED') && !currentDispatch.deliveredAt
        ? now
        : currentDispatch.deliveredAt,
  };

  const newNote = serializeSaleNote(customerNote, updatedDispatch);

  const updatedSale = await prisma.sale.update({
    where: { id: input.saleId },
    data: { note: newNote },
  });

  await logAction({
    userId: user.id,
    action: 'UPDATE_DISPATCH',
    entity: 'Sale',
    entityId: sale.id,
    details: `Updated dispatch status to ${input.status} (Waybill: ${updatedDispatch.waybillNo})`,
  });

  revalidatePath('/sales/deliveries');
  revalidatePath('/sales/quotations');
  revalidatePath('/sales');
  revalidatePath(`/waybill/${input.saleId}`);

  return { success: true, dispatch: updatedDispatch };
}

export interface ConvertQuotationInput {
  quotationId: string;
  paymentMethod: 'CASH' | 'MOBILE_MONEY' | 'CARD' | 'CREDIT';
  paidAmount?: number;
  deliveryAddress?: string;
  driverName?: string;
  vehicleNo?: string;
  note?: string;
}

export async function convertQuotationToSale(input: ConvertQuotationInput) {
  const user = await requireAuth();

  const quotation = await prisma.sale.findUnique({
    where: { id: input.quotationId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      customer: true,
    },
  });

  if (!quotation) {
    throw new Error('Quotation not found');
  }

  if (quotation.status !== 'QUOTATION' && quotation.status !== 'DRAFT') {
    throw new Error(`Transaction is already ${quotation.status} and cannot be converted.`);
  }

  // Verify stock sufficiency for all items
  for (const item of quotation.items) {
    if (item.product.stockQuantity < item.quantity) {
      throw new Error(
        `Insufficient stock for "${item.product.name}" (Required: ${item.quantity}, Available: ${item.product.stockQuantity})`
      );
    }
  }

  const totalAmountNum = Number(quotation.totalAmount);
  const paidAmount = input.paidAmount ?? (input.paymentMethod === 'CREDIT' ? 0 : totalAmountNum);
  const changeAmount = Math.max(0, paidAmount - totalAmountNum);

  // Set initial dispatch details
  const { customerNote } = parseSaleDispatch(quotation.note, quotation.id, quotation.invoiceNo);
  const dispatchData: DispatchInfo = {
    status: 'PENDING_DISPATCH',
    waybillNo: generateDefaultWaybillNo(quotation.id, quotation.invoiceNo),
    deliveryAddress: input.deliveryAddress || '',
    driverName: input.driverName || '',
    vehicleNo: input.vehicleNo || '',
    notes: input.note || '',
  };

  const serializedNote = serializeSaleNote(
    input.note ? `${customerNote} | ${input.note}`.trim() : customerNote,
    dispatchData
  );

  const completedSale = await prisma.$transaction(async (tx) => {
    // 1. Deduct stock for all items
    for (const item of quotation.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            decrement: item.quantity,
          },
        },
      });
    }

    // 2. Update sale record to COMPLETED
    const updated = await tx.sale.update({
      where: { id: quotation.id },
      data: {
        status: 'COMPLETED',
        paymentMethod: input.paymentMethod,
        paidAmount,
        changeAmount,
        note: serializedNote,
      },
    });

    // 3. Record payment if paidAmount > 0
    if (paidAmount > 0) {
      await tx.payment.create({
        data: {
          saleId: quotation.id,
          method: input.paymentMethod,
          amount: paidAmount,
          note: `Payment upon quotation conversion to sale (${quotation.invoiceNo})`,
        },
      });
    }

    return updated;
  });

  await logAction({
    userId: user.id,
    action: 'CONVERT_QUOTATION_TO_SALE',
    entity: 'Sale',
    entityId: quotation.id,
    details: `Converted Quotation ${quotation.invoiceNo} to COMPLETED sale via ${input.paymentMethod} (Amount: GH₵${totalAmountNum.toFixed(2)})`,
  });

  revalidatePath('/inventory');
  revalidatePath('/sales');
  revalidatePath('/sales/quotations');
  revalidatePath('/sales/deliveries');
  revalidatePath('/pos');
  revalidatePath(`/receipt/${quotation.id}`);
  revalidatePath(`/waybill/${quotation.id}`);

  return { success: true, saleId: completedSale.id };
}

export async function getDeliveries(options?: {
  status?: string;
  search?: string;
  take?: number;
}) {
  await requireAuth();

  try {
    const sales = await prisma.sale.findMany({
      where: {
        status: { in: ['COMPLETED', 'QUOTATION'] },
      },
      take: options?.take ?? 100,
      include: {
        customer: {
          include: { group: true },
        },
        cashier: {
          select: { id: true, name: true, email: true },
        },
        location: true,
        items: {
          include: {
            product: {
              include: { unit: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Parse dispatch info for each sale
    const enriched = sales.map((sale) => {
      const { customerNote, dispatch } = parseSaleDispatch(
        sale.note,
        sale.id,
        sale.invoiceNo
      );
      return {
        ...sale,
        totalAmount: Number(sale.totalAmount),
        paidAmount: Number(sale.paidAmount),
        discountAmount: Number(sale.discountAmount),
        taxAmount: Number(sale.taxAmount),
        customerNote,
        dispatch,
      };
    });

    // Filter by dispatch status if provided
    let filtered = enriched;
    if (options?.status && options.status !== 'ALL') {
      filtered = filtered.filter((s) => s.dispatch.status === options.status);
    }

    // Filter by search query if provided
    if (options?.search && options.search.trim()) {
      const query = options.search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.invoiceNo?.toLowerCase().includes(query) ||
          s.dispatch.waybillNo?.toLowerCase().includes(query) ||
          s.customer?.name.toLowerCase().includes(query) ||
          s.customer?.phone?.toLowerCase().includes(query) ||
          s.dispatch.driverName?.toLowerCase().includes(query) ||
          s.dispatch.vehicleNo?.toLowerCase().includes(query)
      );
    }

    return filtered;
  } catch (err) {
    console.error('Error fetching deliveries:', err);
    return [];
  }
}

export async function getWaybillSale(id: string) {
  await requireAuth();

  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      customer: {
        include: { group: true },
      },
      cashier: {
        select: { id: true, name: true, email: true },
      },
      location: true,
      items: {
        include: {
          product: {
            include: { unit: true, category: true, brand: true },
          },
        },
      },
      payments: true,
    },
  });

  if (!sale) return null;

  const { customerNote, dispatch } = parseSaleDispatch(
    sale.note,
    sale.id,
    sale.invoiceNo
  );

  return {
    ...sale,
    totalAmount: Number(sale.totalAmount),
    paidAmount: Number(sale.paidAmount),
    discountAmount: Number(sale.discountAmount),
    taxAmount: Number(sale.taxAmount),
    changeAmount: Number(sale.changeAmount),
    customerNote,
    dispatch,
    items: sale.items.map((item) => ({
      ...item,
      priceAtSale: Number(item.priceAtSale),
      costAtSale: Number(item.costAtSale),
    })),
  };
}

