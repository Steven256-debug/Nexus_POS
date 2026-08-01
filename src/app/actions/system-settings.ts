'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { logAction } from '@/lib/audit';
import { requireAuth, requireAdmin, type ActionResult, ok, err } from '@/lib/action-utils';

export async function getSetting(key: string): Promise<string | null> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key } });
    return setting?.value ?? null;
  } catch (err) {
    console.error('Offline or DB Error in getSetting:', err);
    return null;
  }
}

export async function getSettings(): Promise<Record<string, string>> {
  const settings = await prisma.setting.findMany();
  const map: Record<string, string> = {};
  settings.forEach(s => { map[s.key] = s.value; });
  return map;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await requireAdmin();

  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  revalidatePath('/settings');
  revalidatePath('/pos');
}

/**
 * Clears all transactional test data.
 * Requires explicit confirmation string to prevent accidental invocation.
 */
export async function clearTestData(
  confirmationPhrase: string
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();

    // Safety: require an exact confirmation phrase
    if (confirmationPhrase !== 'DELETE ALL TRANSACTIONS') {
      return err('Confirmation phrase does not match. Expected: "DELETE ALL TRANSACTIONS"');
    }

    // Log BEFORE clearing, so the audit trail survives even if audit logs are cleared
    await logAction({
      userId: admin.id,
      action: 'CLEAR_TEST_DATA_INITIATED',
      entity: 'System',
      details: `Admin ${admin.email} initiated full transaction data wipe`,
    });

    await prisma.$transaction([
      prisma.payment.deleteMany(),
      prisma.returnItem.deleteMany(),
      prisma.return.deleteMany(),
      prisma.saleItem.deleteMany(),
      prisma.sale.deleteMany(),
      prisma.expense.deleteMany(),
      // NOTE: Audit logs are intentionally NOT deleted — they are the permanent record
    ]);

    await logAction({
      userId: admin.id,
      action: 'CLEAR_TEST_DATA_COMPLETED',
      entity: 'System',
      details: 'Cleared all transactions (sales, returns, expenses, payments). Audit logs preserved.',
    });

    revalidatePath('/sales');
    revalidatePath('/pos');
    revalidatePath('/reports');
    revalidatePath('/expenses');

    return ok(undefined);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(message);
  }
}
