'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAction } from '@/lib/audit';

type ReturnItemInput = {
  saleItemId: string;
  quantity: number;
  condition: 'GOOD' | 'DAMAGED';
};

export async function processReturn({
  saleId,
  items,
  reason,
}: {
  saleId: string;
  items: ReturnItemInput[];
  reason?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) throw new Error('Unauthorized');

    if (items.length === 0) throw new Error('No items to return');

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch sale to verify and calculate amount
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { items: true },
      });
      if (!sale) throw new Error('Sale not found');

      let totalRefundAmount = 0;

      // 2. Calculate refund amount and handle inventory
      for (const input of items) {
        const saleItem = sale.items.find((i) => i.id === input.saleItemId);
        if (!saleItem) throw new Error(`Sale item ${input.saleItemId} not found on this sale`);
        if (input.quantity > saleItem.quantity) throw new Error(`Cannot return more than purchased for item ${saleItem.id}`);

        // Currently we do not check if it was already returned previously in another return,
        // for a robust system we'd check sum of previous returns for this saleItem.
        // For Phase 4, we assume a simple return model.

        totalRefundAmount += saleItem.priceAtSale * input.quantity;

        // If GOOD, return to stock
        if (input.condition === 'GOOD') {
          await tx.product.update({
            where: { id: saleItem.productId },
            data: { stockQuantity: { increment: input.quantity } },
          });
        }
      }

      // 3. Create Return and ReturnItems
      const returnRecord = await tx.return.create({
        data: {
          saleId,
          userId,
          amount: totalRefundAmount,
          reason,
          items: {
            create: items.map((i) => ({
              saleItemId: i.saleItemId,
              quantity: i.quantity,
              condition: i.condition,
            })),
          },
        },
      });

      // 4. Update Sale status to REFUNDED
      await tx.sale.update({
        where: { id: saleId },
        data: { status: 'REFUNDED' }, // or PARTIALLY_RETURNED
      });

      return returnRecord;
    });

    await logAction({
      userId,
      action: 'PROCESS_RETURN',
      entity: 'Return',
      entityId: result.id,
      details: `Processed return for sale ${saleId} amount ${result.amount}`,
    });

    revalidatePath('/sales');
    revalidatePath('/inventory');
    return { success: true, returnId: result.id };
  } catch (error: any) {
    return { error: error.message };
  }
}
