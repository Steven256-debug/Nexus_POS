'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { userInputSchema } from '@/lib/validators';
import { logAction } from '@/lib/audit';
import { requireAdmin, type ActionResult, ok, err } from '@/lib/action-utils';
import { z } from 'zod';

export async function getUsers() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    }
  });
  return users;
}

export async function createUser(data: z.infer<typeof userInputSchema>): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();

    const parsed = userInputSchema.parse(data);
    if (!parsed.password) return err('Password is required for new users');

    const existing = await prisma.user.findUnique({ where: { email: parsed.email } });
    if (existing) return err('Email already exists');

    const hashedPassword = await bcrypt.hash(parsed.password, 10);

    const user = await prisma.user.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        password: hashedPassword,
        role: parsed.role,
        isActive: true,
      },
    });

    await logAction({
      userId: admin.id,
      action: 'CREATE_USER',
      entity: 'User',
      entityId: user.id,
      details: `Created user ${user.email} with role ${user.role}`,
    });

    revalidatePath('/users');
    return ok(undefined);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(message);
  }
}

export async function updateUser(
  id: string,
  data: Partial<z.infer<typeof userInputSchema>>
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();

    const parsed = userInputSchema.partial().parse(data);
    const updateData: Record<string, string> = {};
    if (parsed.name !== undefined) updateData.name = parsed.name;
    if (parsed.email !== undefined) updateData.email = parsed.email;
    if (parsed.role !== undefined) updateData.role = parsed.role;
    if (parsed.password) {
      updateData.password = await bcrypt.hash(parsed.password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    await logAction({
      userId: admin.id,
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: user.id,
      details: `Updated user ${user.email}`,
    });

    revalidatePath('/users');
    return ok(undefined);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(message);
  }
}

export async function toggleUserStatus(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();

    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
    });

    await logAction({
      userId: admin.id,
      action: isActive ? 'ENABLE_USER' : 'DISABLE_USER',
      entity: 'User',
      entityId: user.id,
      details: `Set user ${user.email} isActive to ${isActive}`,
    });

    revalidatePath('/users');
    return ok(undefined);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(message);
  }
}
