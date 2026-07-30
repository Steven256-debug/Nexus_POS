'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth, requireAdmin } from '@/lib/action-utils';
import { businessLocationSchema } from '@/lib/validators';

export async function updateBusinessLocation(id: string | undefined, data: { name: string; code: string; address: string }) {
  await requireAdmin();

  // Validate inputs
  const validated = businessLocationSchema.parse(data);

  if (id) {
    await prisma.businessLocation.update({
      where: { id },
      data: validated
    });
  } else {
    await prisma.businessLocation.create({
      data: validated
    });
  }

  revalidatePath('/settings');
}

export async function getBusinessLocation() {
  await requireAuth();

  return await prisma.businessLocation.findFirst({
    orderBy: { name: 'asc' }
  });
}
