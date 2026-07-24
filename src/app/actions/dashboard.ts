'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getDashboardMetrics() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  // 1. Today's Revenue & Completed Sales Count (DB Aggregation)
  const todaySalesAgg = await prisma.sale.aggregate({
    _sum: { totalAmount: true },
    _count: { id: true },
    where: {
      status: 'COMPLETED',
      createdAt: { gte: startOfToday }
    }
  });

  // 2. Yesterday's Revenue for Real Growth %
  const yesterdaySalesAgg = await prisma.sale.aggregate({
    _sum: { totalAmount: true },
    where: {
      status: 'COMPLETED',
      createdAt: { gte: startOfYesterday, lt: startOfToday }
    }
  });

  const todayRevenue = todaySalesAgg._sum.totalAmount ?? 0;
  const yesterdayRevenue = yesterdaySalesAgg._sum.totalAmount ?? 0;
  const revenueGrowth = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

  // 3. Low Stock Items Count & Product Health Counts (DB Aggregation)
  const totalProducts = await prisma.product.count({
    where: { deletedAt: null }
  });

  const lowStockProducts = await prisma.product.findMany({
    where: {
      deletedAt: null,
      stockQuantity: { lte: prisma.product.fields.minStockAlert }
    },
    include: { category: true },
    take: 10
  });

  // 4. 30-Day Sales & Real Profit Trend Data
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const salesLast30Days = await prisma.sale.findMany({
    where: {
      status: 'COMPLETED',
      createdAt: { gte: thirtyDaysAgo }
    },
    include: {
      items: true
    },
    orderBy: { createdAt: 'asc' }
  });

  // Aggregate by day
  const salesByDayMap = new Map<string, { sales: number; cogs: number }>();

  // Pre-fill 30 days
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    salesByDayMap.set(dStr, { sales: 0, cogs: 0 });
  }

  salesLast30Days.forEach(sale => {
    const dStr = new Date(sale.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = salesByDayMap.get(dStr) || { sales: 0, cogs: 0 };
    
    const saleCOGS = sale.items.reduce((sum, item) => sum + (item.costAtSale * item.quantity), 0);
    salesByDayMap.set(dStr, {
      sales: existing.sales + sale.totalAmount,
      cogs: existing.cogs + saleCOGS
    });
  });

  const days30 = Array.from(salesByDayMap.entries()).map(([date, data]) => ({
    date,
    sales: data.sales,
    profit: data.sales - data.cogs
  }));

  // 5. Recent Sales for Activity Feed (Limit 5)
  const recentSales = await prisma.sale.findMany({
    where: { status: 'COMPLETED' },
    include: { cashier: true, items: true },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  return {
    todayRevenue,
    todaySalesCount: todaySalesAgg._count.id,
    revenueGrowth,
    totalProducts,
    lowStockCount: lowStockProducts.length,
    lowStockProducts,
    days30,
    recentSales
  };
}
