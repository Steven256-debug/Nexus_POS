import { prisma } from '@/lib/prisma';

export async function logAction({
  userId,
  action,
  entity,
  entityId,
  details,
}: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details,
      },
    });
  } catch (error) {
    console.error('Failed to log audit action:', error);
    // We don't throw here to avoid failing the main transaction if logging fails
  }
}
