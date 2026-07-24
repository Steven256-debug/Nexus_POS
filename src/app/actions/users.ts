'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { logAction } from '@/lib/audit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const UserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(['ADMIN', 'EMPLOYEE']),
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
  return session.user;
}

export async function getUsers() {
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

export async function createUser(data: z.infer<typeof UserSchema>) {
  try {
    const admin = await requireAdmin();

    const parsed = UserSchema.parse(data);
    if (!parsed.password) throw new Error('Password is required for new users');

    const existing = await prisma.user.findUnique({ where: { email: parsed.email } });
    if (existing) return { error: 'Email already exists' };

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
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateUser(id: string, data: Partial<z.infer<typeof UserSchema>>) {
  try {
    const admin = await requireAdmin();

    let updateData: any = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    } else {
      delete updateData.password;
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
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function toggleUserStatus(id: string, isActive: boolean) {
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
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
