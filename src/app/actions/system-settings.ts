'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { logAction } from '@/lib/audit';

export async function getSetting(key: string): Promise<string | null> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  return setting?.value ?? null;
}

export async function getSettings(): Promise<Record<string, string>> {
  const settings = await prisma.setting.findMany();
  const map: Record<string, string> = {};
  settings.forEach(s => { map[s.key] = s.value; });
  return map;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');
  if (session.user.role !== 'ADMIN') throw new Error('Forbidden: Admins only');

  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  revalidatePath('/settings');
  revalidatePath('/pos');
}

export async function clearTestData() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');
  if (session.user.role !== 'ADMIN') throw new Error('Forbidden: Admins only');

  await prisma.$transaction([
    prisma.payment.deleteMany(),
    prisma.returnItem.deleteMany(),
    prisma.return.deleteMany(),
    prisma.saleItem.deleteMany(),
    prisma.sale.deleteMany(),
    prisma.expense.deleteMany(),
    prisma.auditLog.deleteMany(),
  ]);

  await logAction({
    userId: session.user.id,
    action: 'CLEAR_TEST_DATA',
    entity: 'System',
    details: 'Cleared all transactions (sales, returns, expenses, payments, audit logs)',
  });

  revalidatePath('/sales');
  revalidatePath('/pos');
  revalidatePath('/reports');
  revalidatePath('/expenses');
  revalidatePath('/audit-logs');
  
  return { success: true };
}
