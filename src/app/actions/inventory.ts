'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { productInputSchema, metadataItemSchema } from '@/lib/validators';
import { z } from 'zod';
import { logAction } from '@/lib/audit';

export async function getProducts(options?: { take?: number; skip?: number; categoryId?: string }) {
  return await prisma.product.findMany({
    where: {
      deletedAt: null,
      categoryId: options?.categoryId || undefined
    },
    take: options?.take,
    skip: options?.skip,
    include: {
      metadata: true,
      category: true,
      brand: true,
      unit: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

export async function getProduct(id: string) {
  return await prisma.product.findUnique({
    where: { id },
    include: {
      metadata: true,
      category: true,
      brand: true,
      unit: true,
    }
  });
}

export async function createProduct(
  data: z.infer<typeof productInputSchema>,
  metadata: { key: string; value: string }[]
) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');
  if (session.user.role !== 'ADMIN') throw new Error('Forbidden: Admins only');

  // Validate inputs
  const validated = productInputSchema.parse(data);
  const validatedMeta = z.array(metadataItemSchema).parse(metadata || []);

  const result = await prisma.product.create({
    data: {
      name: validated.name,
      sku: validated.sku,
      barcode: validated.barcode,
      categoryId: validated.categoryId,
      brandId: validated.brandId,
      unitId: validated.unitId,
      pricePerUnit: validated.pricePerUnit,
      costPrice: validated.costPrice,
      stockQuantity: validated.stockQuantity,
      minStockAlert: validated.minStockAlert,
      imageUrl: validated.imageUrl,
      isFeatured: validated.isFeatured,
      metadata: {
        create: validatedMeta
      }
    }
  });
  revalidatePath('/inventory');
  revalidatePath('/pos');
  return result;
}

export async function updateProduct(
  id: string,
  data: z.infer<typeof productInputSchema>,
  metadata: { key: string; value: string }[]
) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');
  if (session.user.role !== 'ADMIN') throw new Error('Forbidden: Admins only');

  // Validate inputs
  const validated = productInputSchema.parse(data);
  const validatedMeta = z.array(metadataItemSchema).parse(metadata || []);

  const result = await prisma.product.update({
    where: { id },
    data: {
      name: validated.name,
      sku: validated.sku,
      barcode: validated.barcode,
      categoryId: validated.categoryId,
      brandId: validated.brandId,
      unitId: validated.unitId,
      pricePerUnit: validated.pricePerUnit,
      costPrice: validated.costPrice,
      stockQuantity: validated.stockQuantity,
      minStockAlert: validated.minStockAlert,
      imageUrl: validated.imageUrl,
      isFeatured: validated.isFeatured,
      metadata: {
        deleteMany: {}, // Atomically clear old metadata
        create: validatedMeta // Atomically create new metadata
      }
    }
  });
  revalidatePath('/inventory');
  revalidatePath('/pos');
  return result;
}

export async function deleteProduct(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');
  if (session.user.role !== 'ADMIN') throw new Error('Forbidden: Admins only');

  // Soft delete: set deletedAt instead of hard deleting
  const result = await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() }
  });
  
  await logAction({
    userId: session.user.id,
    action: 'DELETE_PRODUCT',
    entity: 'Product',
    entityId: id,
    details: `Soft deleted product ${result.sku}`,
  });
  
  revalidatePath('/inventory');
  revalidatePath('/pos');
  return result;
}

export async function importProductsBatch(products: z.infer<typeof productInputSchema>[]) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');
  if (session.user.role !== 'ADMIN') throw new Error('Forbidden: Admins only');

  // Validate each product
  const validated = products.map(p => productInputSchema.parse(p));

  const result = await prisma.$transaction(
    validated.map(p => prisma.product.create({
      data: {
        name: p.name,
        sku: p.sku,
        pricePerUnit: p.pricePerUnit,
        costPrice: p.costPrice,
        stockQuantity: p.stockQuantity,
        minStockAlert: p.minStockAlert,
        imageUrl: p.imageUrl || null
      }
    }))
  );
  revalidatePath('/inventory');
  revalidatePath('/pos');
  return result;
}

export async function getCategories() {
  return await prisma.category.findMany({
    include: { products: { where: { deletedAt: null } } },
    orderBy: { name: 'asc' }
  });
}

export async function createCategory(name: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  if (!name || name.trim().length === 0) {
    throw new Error('Category name is required');
  }

  const result = await prisma.category.create({
    data: { name: name.trim() }
  });
  revalidatePath('/inventory/categories');
  revalidatePath('/inventory');
  revalidatePath('/pos');
  return result;
}

export async function deleteCategory(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  const result = await prisma.category.delete({
    where: { id }
  });
  revalidatePath('/inventory/categories');
  revalidatePath('/inventory');
  revalidatePath('/pos');
  return result;
}

export async function getUnits() {
  return await prisma.unit.findMany({
    include: { products: { where: { deletedAt: null } } },
    orderBy: { name: 'asc' }
  });
}

export async function createUnit(name: string, shortName: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  if (!name || !shortName) {
    throw new Error('Unit name and short name are required');
  }

  const result = await prisma.unit.create({
    data: { name: name.trim(), shortName: shortName.trim() }
  });
  revalidatePath('/inventory/units');
  revalidatePath('/inventory');
  revalidatePath('/pos');
  return result;
}

export async function deleteUnit(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  const result = await prisma.unit.delete({
    where: { id }
  });
  revalidatePath('/inventory/units');
  revalidatePath('/inventory');
  revalidatePath('/pos');
  return result;
}
