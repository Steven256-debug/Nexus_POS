'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { saleInputSchema } from '@/lib/validators';
import { z } from 'zod';

export async function processSale(data: z.infer<typeof saleInputSchema>) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('Unauthorized: You must be logged in to process a sale');
  }
  const cashierId = session.user.id;

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

    // Generate unique invoice number INSIDE the transaction to prevent race conditions
    const count = await tx.sale.count();
    const invoiceNo = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // If completed sale, check and deduct stock, capture cost price
    const itemsWithCost = [];
    if (status === 'COMPLETED') {
      for (const item of validated.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });
        if (!product || product.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for product ${product?.name ?? item.productId}`);
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
          costAtSale: product.costPrice,
        });
      }
    } else {
      // For drafts/quotations, still capture cost price for later
      for (const item of validated.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });
        itemsWithCost.push({
          productId: item.productId,
          quantity: item.quantity,
          priceAtSale: item.priceAtSale,
          costAtSale: product?.costPrice ?? 0,
        });
      }
    }

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
  });

  revalidatePath('/inventory');
  revalidatePath('/pos');
  revalidatePath('/sales');
  return sale;
}

export async function getSales(options?: { take?: number; skip?: number }) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  return await prisma.sale.findMany({
    take: options?.take ?? 200,
    skip: options?.skip,
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
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  return await prisma.sale.findUnique({
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
}
