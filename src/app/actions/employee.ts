'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/action-utils';

export async function getEmployeeDashboardData(employeeId: string) {
  const sessionUser = await requireAuth();

  // IDOR protection: employees can only view their own data, admins can view anyone's
  if (sessionUser.role === 'EMPLOYEE' && sessionUser.id !== employeeId) {
    throw new Error('Forbidden: You can only view your own dashboard');
  }

  let user = await prisma.user.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    }
  });

  if (!user) {
    // Fallback if user not found
    user = {
      id: employeeId,
      name: 'Unknown Employee',
      email: 'unknown@store.com',
      role: 'EMPLOYEE',
      createdAt: new Date(),
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch today's sales for this employee (stats)
  const todaySales = await prisma.sale.findMany({
    where: {
      cashierId: employeeId,
      createdAt: { gte: today },
      status: 'COMPLETED'
    },
    include: {
      items: {
        include: { product: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const todayRevenue = todaySales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
  const totalItemsSold = todaySales.reduce((sum, sale) => sum + sale.items.reduce((acc, item) => acc + item.quantity, 0), 0);

  // Fetch recent sales (limited to 10, any date) for activity feed
  const recentSales = await prisma.sale.findMany({
    where: { cashierId: employeeId },
    include: {
      items: {
        include: { product: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  return {
    user,
    stats: {
      todayRevenue,
      todaySalesCount: todaySales.length,
      totalItemsSold
    },
    recentSales
  };
}
