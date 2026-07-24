'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { businessLocationSchema } from '@/lib/validators';

export async function updateBusinessLocation(id: string | undefined, data: { name: string; code: string; address: string }) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');
  if (session.user.role !== 'ADMIN') throw new Error('Forbidden: Admins only');

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
