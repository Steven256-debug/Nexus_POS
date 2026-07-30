'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/action-utils';
import type { DashboardMetrics, DailyTrendData, CategoryDistribution } from '@/types';

const CHART_COLORS = [
  '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
];

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  await requireAuth();

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

  const todayRevenue = Number(todaySalesAgg._sum.totalAmount ?? 0);
  const yesterdayRevenue = Number(yesterdaySalesAgg._sum.totalAmount ?? 0);
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
    include: { category: true, brand: true, unit: true, metadata: true },
    take: 10
  });

  // 4. 30-Day Sales Trend — Aggregated via raw SQL to avoid loading all records
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDate = thirtyDaysAgo;
  const endDate = new Date();

  type DayAgg = { day: Date; revenue: number; cogs: number };
  const dailyAgg = await prisma.$queryRaw<DayAgg[]>`
    SELECT
      DATE("sales"."createdAt") as day,
      COALESCE(SUM("sales"."total_amount"), 0)::float as revenue,
      COALESCE(SUM("sale_items"."cost_at_sale" * "sale_items"."quantity"), 0)::float as cogs
    FROM "sales"
    LEFT JOIN "sale_items" ON "sale_items"."sale_id_fk" = "sales"."id"
    WHERE "sales"."status" = 'COMPLETED'::"SaleStatus"
      AND "sales"."createdAt" >= ${startDate}
      AND "sales"."createdAt" <= ${endDate}
    GROUP BY DATE("sales"."createdAt")
    ORDER BY day ASC
  `;

  // Build map from raw results, then fill 30-day range
  const aggMap = new Map<string, { sales: number; cogs: number }>();
  dailyAgg.forEach(row => {
    const dStr = new Date(row.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    aggMap.set(dStr, { sales: Number(row.revenue), cogs: Number(row.cogs) });
  });

  const days30: DailyTrendData[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const data = aggMap.get(dStr) || { sales: 0, cogs: 0 };
    days30.push({
      date: dStr,
      sales: data.sales,
      profit: data.sales - data.cogs,
    });
  }

  // 5. Real Category Distribution from DB (replaces hardcoded dummy data)
  const categoryGroups = await prisma.product.groupBy({
    by: ['categoryId'],
    _count: { id: true },
    where: { deletedAt: null },
  });

  const categoryIds = categoryGroups
    .filter(g => g.categoryId !== null)
    .map(g => g.categoryId as string);

  const categories = categoryIds.length > 0
    ? await prisma.category.findMany({ where: { id: { in: categoryIds } } })
    : [];

  const categoryMap = new Map(categories.map(c => [c.id, c.name]));

  const categoryDistribution: CategoryDistribution[] = categoryGroups.map((g, i) => ({
    name: g.categoryId ? (categoryMap.get(g.categoryId) || 'Unknown') : 'Uncategorized',
    value: g._count.id,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  // 6. Recent Sales for Activity Feed (Limit 5)
  const recentSales = await prisma.sale.findMany({
    where: { status: 'COMPLETED' },
    include: {
      cashier: true,
      customer: true,
      items: { include: { product: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  return {
    todayRevenue,
    todaySalesCount: todaySalesAgg._count.id,
    revenueGrowth,
    totalProducts,
    lowStockCount: lowStockProducts.length,
    lowStockProducts: lowStockProducts as any,
    days30,
    recentSales: recentSales as any,
    categoryDistribution,
  };
}
