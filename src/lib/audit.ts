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
    let validUserId: string | null = null;
    if (userId) {
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });
      if (userExists) validUserId = userExists.id;
    }

    await prisma.auditLog.create({
      data: {
        userId: validUserId,
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
