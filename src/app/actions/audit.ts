'use server';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/action-utils';

export async function getAuditLogs(options?: {
  take?: number;
  skip?: number;
  cursor?: string;
}) {
  await requireAdmin();

  return await prisma.auditLog.findMany({
    take: options?.take || 100,
    skip: options?.skip,
    ...(options?.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
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
