import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  companyName: z.string().max(200).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email().max(200).optional().nullable().or(z.literal('')),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const suppliers = await prisma.supplier.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(suppliers);
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
    const parsed = supplierSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map(i => i.message).join(', ') },
        { status: 400 }
      );
    }

    const { name, companyName, phone, email } = parsed.data;

    const supplier = await prisma.supplier.create({
      data: { name, companyName: companyName || null, phone: phone || null, email: email || null }
    });

    return NextResponse.json(supplier);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
