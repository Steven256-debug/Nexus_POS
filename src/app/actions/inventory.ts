'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { productInputSchema, metadataItemSchema } from '@/lib/validators';
import { z } from 'zod';
import { logAction } from '@/lib/audit';
import { requireAuth, requireAdmin } from '@/lib/action-utils';
import { Prisma } from '@prisma/client';

export async function getProducts(options?: {
  take?: number;
  skip?: number;
  cursor?: string;
  categoryId?: string;
  search?: string;
}) {
  await requireAuth();

  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
  };

  if (options?.categoryId) {
    where.categoryId = options.categoryId;
  }

  if (options?.search) {
    where.OR = [
      { name: { contains: options.search, mode: 'insensitive' } },
      { sku: { contains: options.search, mode: 'insensitive' } },
      { barcode: { contains: options.search, mode: 'insensitive' } },
    ];
  }

  try {
    return await prisma.product.findMany({
      where,
      take: options?.take ?? 100,
      skip: options?.skip,
      ...(options?.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
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
  } catch (err) {
    console.error('Offline or DB Error in getProducts:', err);
    return [];
  }
}

export async function getProduct(id: string) {
  await requireAuth();

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
  await requireAdmin();

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
  await requireAdmin();

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
  const admin = await requireAdmin();

  // Soft delete: set deletedAt instead of hard deleting
  const result = await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() }
  });
  
  await logAction({
    userId: admin.id,
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
  await requireAdmin();

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
  await requireAuth();

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
  await requireAdmin();

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
  await requireAuth();

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
  await requireAdmin();

  const result = await prisma.unit.delete({
    where: { id }
  });
  revalidatePath('/inventory/units');
  revalidatePath('/inventory');
  revalidatePath('/pos');
  return result;
}
