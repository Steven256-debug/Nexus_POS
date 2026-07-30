import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// ─── Unified Action Result Type ──────────────────────────────────
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export function ok<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function err<T = void>(message: string): ActionResult<T> {
  return { success: false, error: message };
}

// ─── Auth Helpers ─────────────────────────────────────────────────
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('Unauthorized: You must be logged in');
  }
  return session.user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== 'ADMIN') {
    throw new Error('Forbidden: Admin access required');
  }
  return user;
}
