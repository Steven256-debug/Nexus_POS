'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getEmployeeDashboardData(employeeId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  let user = await prisma.user.findUnique({
    where: { id: employeeId }
  });

  if (!user) {
    // Fallback to mock data if the dummy user isn't in DB yet
    user = {
      id: employeeId,
      name: 'Kwame Mensah',
      email: 'cashier@frankoventures.com',
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
