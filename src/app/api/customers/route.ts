import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email().max(200).optional().nullable().or(z.literal('')),
  groupId: z.string().optional().nullable(),
  creditLimit: z.union([z.string(), z.number()]).optional().default('0'),
});

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
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });

    const body = await req.json();
    const parsed = customerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map(i => i.message).join(', ') },
        { status: 400 }
      );
    }

    const { name, phone, email, groupId, creditLimit } = parsed.data;

    const customer = await prisma.customer.create({
      data: { 
        name, 
        phone: phone || null, 
        email: email || null, 
        groupId: groupId || null, 
        creditLimit: parseFloat(String(creditLimit) || '0') 
      },
      include: { group: true }
    });

    return NextResponse.json(customer);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
