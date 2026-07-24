'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getAuditLogs(options?: { take?: number; skip?: number }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  return await prisma.auditLog.findMany({
    take: options?.take || 100,
    skip: options?.skip || 0,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          role: true,
        }
      }
    }
  });
}
