import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const customers = await prisma.customer.findMany({ include: { group: true }, orderBy: { name: 'asc' } });
    return NextResponse.json(customers);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { name, phone, email, groupId, creditLimit } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: { 
        name, 
        phone, 
        email, 
        groupId: groupId || null, 
        creditLimit: parseFloat(creditLimit || '0') 
      },
      include: { group: true }
    });

    return NextResponse.json(customer);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
