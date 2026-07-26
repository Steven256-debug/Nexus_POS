import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const groups = await prisma.customerGroup.findMany({ include: { customers: true } });
    return NextResponse.json(groups);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });

    const body = await req.json();
    const { name, discount } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const group = await prisma.customerGroup.create({
      data: { name, discount: parseFloat(discount || '0') }
    });

    return NextResponse.json(group);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
