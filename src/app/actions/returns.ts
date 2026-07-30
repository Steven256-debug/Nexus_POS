'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { returnInputSchema } from '@/lib/validators';
import { logAction } from '@/lib/audit';
import { requireAuth, type ActionResult, ok, err } from '@/lib/action-utils';
import { z } from 'zod';

export async function processReturn(
  data: z.infer<typeof returnInputSchema>
): Promise<ActionResult<{ returnId: string }>> {
  try {
    const user = await requireAuth();

    // Only admins can process returns
    if (user.role !== 'ADMIN') {
      return err('Forbidden: Only administrators can process returns');
    }

    // Validate inputs
    const validated = returnInputSchema.parse(data);

    if (validated.items.length === 0) return err('No items to return');

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch sale to verify and calculate amount
      const sale = await tx.sale.findUnique({
        where: { id: validated.saleId },
        include: { items: true },
      });
      if (!sale) throw new Error('Sale not found');

      let totalRefundAmount = 0;

      // 2. Calculate refund amount and handle inventory
      for (const input of validated.items) {
        const saleItem = sale.items.find((i) => i.id === input.saleItemId);
        if (!saleItem) throw new Error(`Sale item ${input.saleItemId} not found on this sale`);

        // Check how many units of this item have already been returned
        const previousReturns = await tx.returnItem.aggregate({
          _sum: { quantity: true },
          where: { saleItemId: input.saleItemId }
        });
        const alreadyReturned = previousReturns._sum.quantity ?? 0;
        const remainingReturnable = saleItem.quantity - alreadyReturned;

        if (input.quantity > remainingReturnable) {
          throw new Error(
            `Cannot return ${input.quantity} unit(s) — only ${remainingReturnable} remaining (${alreadyReturned} already returned)`
          );
        }

        totalRefundAmount += Number(saleItem.priceAtSale) * input.quantity;

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
          saleId: validated.saleId,
          userId: user.id,
          amount: totalRefundAmount,
          reason: validated.reason,
          items: {
            create: validated.items.map((i) => ({
              saleItemId: i.saleItemId,
              quantity: i.quantity,
              condition: i.condition,
            })),
          },
        },
      });

      // 4. Update Sale status to REFUNDED
      await tx.sale.update({
        where: { id: validated.saleId },
        data: { status: 'REFUNDED' },
      });

      return returnRecord;
    });

    await logAction({
      userId: user.id,
      action: 'PROCESS_RETURN',
      entity: 'Return',
      entityId: result.id,
      details: `Processed return for sale ${validated.saleId} amount ${result.amount}`,
    });

    revalidatePath('/sales');
    revalidatePath('/inventory');
    return ok({ returnId: result.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(message);
  }
}
