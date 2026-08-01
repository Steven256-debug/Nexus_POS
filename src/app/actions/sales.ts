'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { saleInputSchema } from '@/lib/validators';
import { z } from 'zod';
import { requireAuth } from '@/lib/action-utils';
import { logAction } from '@/lib/audit';
import { Prisma } from '@prisma/client';

export async function processSale(data: z.infer<typeof saleInputSchema>) {
  const user = await requireAuth();
  const cashierId = user.id;

  // Validate inputs
  const validated = saleInputSchema.parse(data);

  const status = validated.status;
  const totalAmount = validated.items.reduce(
    (sum, item) => sum + (item.priceAtSale * item.quantity), 0
  );

  const sale = await prisma.$transaction(async (tx) => {
    // If resuming a draft, delete the old draft sale
    if (validated.resumedSaleId) {
      await tx.saleItem.deleteMany({
        where: { saleId: validated.resumedSaleId }
      });
      await tx.payment.deleteMany({
        where: { saleId: validated.resumedSaleId }
      });
      await tx.sale.delete({
        where: { id: validated.resumedSaleId }
      });
    }

    // Generate unique invoice number using PostgreSQL advisory lock to prevent race conditions
    await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(1)`);
    const lastSale = await tx.sale.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { invoiceNo: true }
    });
    const year = new Date().getFullYear();
    let nextNum = 1;
    if (lastSale?.invoiceNo) {
      const parts = lastSale.invoiceNo.split('-');
      const lastYear = parseInt(parts[1]);
      const lastNum = parseInt(parts[2]);
      if (lastYear === year) {
        nextNum = lastNum + 1;
      }
    }
    const invoiceNo = `INV-${year}-${String(nextNum).padStart(4, '0')}`;

    // Batch-fetch all products at once to avoid N+1 queries
    const productIds = validated.items.map(item => item.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds } }
    });
    const productMap = new Map(products.map(p => [p.id, p]));

    // If completed sale, check and deduct stock, capture cost price
    const itemsWithCost: {
      productId: string;
      quantity: number;
      priceAtSale: number;
      costAtSale: number;
    }[] = [];

    if (status === 'COMPLETED') {
      for (const item of validated.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }
        if (product.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for product ${product.name} (available: ${product.stockQuantity}, requested: ${item.quantity})`);
        }
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: product.stockQuantity - item.quantity
          }
        });
        itemsWithCost.push({
          productId: item.productId,
          quantity: item.quantity,
          priceAtSale: item.priceAtSale,
          costAtSale: Number(product.costPrice),
        });
      }
    } else {
      // For drafts/quotations, still capture cost price for later
      for (const item of validated.items) {
        const product = productMap.get(item.productId);
        itemsWithCost.push({
          productId: item.productId,
          quantity: item.quantity,
          priceAtSale: item.priceAtSale,
          costAtSale: product ? Number(product.costPrice) : 0,
        });
      }
    }

    // Calculate paidAmount and changeAmount from payments
    const paidAmount = validated.payments
      ? validated.payments.reduce((sum, p) => sum + p.amount, 0)
      : 0;
    const netAmount = totalAmount - validated.discountAmount + validated.taxAmount;
    const changeAmount = Math.max(0, paidAmount - netAmount);

    // Create Sale record
    return await tx.sale.create({
      data: {
        invoiceNo,
        cashierId,
        customerId: validated.customerId || null,
        status,
        paymentMethod: validated.paymentMethod,
        totalAmount,
        discountAmount: validated.discountAmount,
        taxAmount: validated.taxAmount,
        paidAmount,
        changeAmount,
        note: validated.note || null,
        items: {
          create: itemsWithCost.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            priceAtSale: item.priceAtSale,
            costAtSale: item.costAtSale,
          }))
        },
        payments: validated.payments && validated.payments.length > 0 ? {
          create: validated.payments.map(p => ({
            method: p.method,
            amount: p.amount
          }))
        } : undefined
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        payments: true
      }
    });
  }, {
    maxWait: 15000, // 15 seconds to wait for a connection
    timeout: 30000, // 30 seconds for the transaction to complete
  });

  // Audit log for completed sales
  if (status === 'COMPLETED') {
    await logAction({
      userId: cashierId,
      action: 'COMPLETE_SALE',
      entity: 'Sale',
      entityId: sale.id,
      details: `Completed sale ${sale.invoiceNo} for ${totalAmount.toFixed(2)}`,
    });
  }

  revalidatePath('/inventory');
  revalidatePath('/pos');
  revalidatePath('/sales');
  return sale;
}

export async function getSales(options?: {
  take?: number;
  skip?: number;
  cursor?: string;
  status?: string;
}) {
  const user = await requireAuth();

  const where: Prisma.SaleWhereInput = {};
  if (options?.status) {
    where.status = options.status as any;
  }
  // Employees can only see their own sales
  if (user.role === 'EMPLOYEE') {
    where.cashierId = user.id;
  }

  return await prisma.sale.findMany({
    take: options?.take ?? 50,
    skip: options?.skip,
    ...(options?.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
    where,
    include: {
      items: {
        include: {
          product: true
        }
      },
      cashier: true,
      customer: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

export async function getSale(id: string) {
  const user = await requireAuth();

  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true
        }
      },
      cashier: true,
      customer: true,
      payments: true
    }
  });

  if (!sale) {
    throw new Error('Sale not found');
  }

  // IDOR protection: employees can only view their own sales
  if (user.role === 'EMPLOYEE' && sale.cashierId !== user.id) {
    throw new Error('Forbidden: You can only view your own sales');
  }

  return sale;
}
