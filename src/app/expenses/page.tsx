import { prisma } from '@/lib/prisma';
import ExpensesClient from './expenses-client';

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
  const expenses = await prisma.expense.findMany({
    orderBy: { date: 'desc' },
    include: { user: true }
  });

  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto pb-12">
      <ExpensesClient initialExpenses={expenses} />
    </div>
  );
}
