import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { expenseInputSchema } from '@/lib/validators';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const expenses = await prisma.expense.findMany({
      orderBy: { date: 'desc' },
      include: { user: true },
      take: 200
    });
    return NextResponse.json(expenses);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Validate input with Zod
    const parsed = expenseInputSchema.safeParse({
      category: body.category,
      amount: typeof body.amount === 'string' ? parseFloat(body.amount) : body.amount,
      description: body.description,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map(i => i.message).join(', ') },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        category: parsed.data.category,
        amount: parsed.data.amount,
        description: parsed.data.description || null,
        userId: session.user.id || null,
      }
    });

    return NextResponse.json(expense);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
