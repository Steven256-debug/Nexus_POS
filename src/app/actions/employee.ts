'use server';

import { prisma } from '@/lib/prisma';

export async function getEmployeeDashboardData(employeeId: string) {
  let user = await prisma.user.findUnique({
    where: { id: employeeId }
  });

  if (!user) {
    // Fallback to mock data if the dummy user isn't in DB yet
    user = {
      id: employeeId,
      email: 'cashier@example.com',
      password: '',
      role: 'EMPLOYEE',
      createdAt: new Date(),
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch sales for this employee
  const sales = await prisma.sale.findMany({
    where: { cashierId: employeeId },
    include: {
      items: {
        include: { product: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const todaySales = sales.filter(s => new Date(s.createdAt) >= today);
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalItemsSold = todaySales.reduce((sum, sale) => sum + sale.items.reduce((acc, item) => acc + item.quantity, 0), 0);

  return {
    user,
    stats: {
      todayRevenue,
      todaySalesCount: todaySales.length,
      totalItemsSold
    },
    recentSales: sales.slice(0, 10)
  };
}
