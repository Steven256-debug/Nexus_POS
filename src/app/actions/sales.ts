'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function processSale(dummyCashierId: string, paymentMethod: string, items: {productId: string, quantity: number, priceAtSale: number}[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error('Not authenticated');
  }
  const cashierId = (session.user as any).id;

  const totalAmount = items.reduce((sum, item) => sum + (item.priceAtSale * item.quantity), 0);

  const sale = await prisma.$transaction(async (tx) => {
    // Check and deduct stock
    for (const item of items) {
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
    }

    // Create Sale
    return await tx.sale.create({
      data: {
        cashierId,
        paymentMethod,
        totalAmount,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            priceAtSale: item.priceAtSale
          }))
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });
  });

  revalidatePath('/inventory');
  revalidatePath('/pos');
  return sale;
}

export async function getSales() {
  return await prisma.sale.findMany({
    include: {
      items: {
        include: {
          product: true
        }
      },
      cashier: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

export async function getSale(id: string) {
  return await prisma.sale.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true
        }
      },
      cashier: true
    }
  });
}
