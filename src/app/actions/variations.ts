'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getVariations() {
  return await prisma.variationTemplate.findMany({
    include: {
      options: true
    },
    orderBy: {
      name: 'asc'
    }
  });
}

export async function createVariation(name: string, options: string[]) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');
  if (session.user.role !== 'ADMIN') throw new Error('Forbidden: Admins only');

  const result = await prisma.variationTemplate.create({
    data: {
      name,
      options: {
        create: options.map(opt => ({ value: opt }))
      }
    }
  });
  
  revalidatePath('/inventory/variations');
  return result;
}

export async function deleteVariation(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');
  if (session.user.role !== 'ADMIN') throw new Error('Forbidden: Admins only');

  const result = await prisma.variationTemplate.delete({
    where: { id }
  });

  revalidatePath('/inventory/variations');
  return result;
}
