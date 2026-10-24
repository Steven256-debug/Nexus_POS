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
      { name: { contains: options.search } },
      { sku: { contains: options.search } },
      { barcode: { contains: options.search } },
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

async function resolveCategoryId(categoryId?: string | null, categoryName?: string | null): Promise<string | null> {
  if (categoryId) {
    const exists = await prisma.category.findUnique({ where: { id: categoryId } });
    if (exists) return exists.id;
  }
  if (categoryName && categoryName.trim().length > 0) {
    const trimmed = categoryName.trim();
    const existing = await prisma.category.findFirst({
      where: { name: trimmed }
    });
    if (existing) return existing.id;
    const created = await prisma.category.create({
      data: { name: trimmed }
    });
    return created.id;
  }
  return null;
}

export async function createProduct(
  data: z.infer<typeof productInputSchema>,
  metadata: { key: string; value: string }[]
) {
  const user = await requireAuth();

  // Validate inputs
  const validated = productInputSchema.parse(data);
  const validatedMeta = z.array(metadataItemSchema).parse(metadata || []);

  const cleanSku = validated.sku.trim();
  const cleanBarcode = validated.barcode?.trim() || null;

  // Check for existing product by SKU
  const existingSku = await prisma.product.findFirst({
    where: { sku: cleanSku }
  });
  if (existingSku) {
    if (existingSku.deletedAt !== null) {
      // Clean up previous soft-deleted product with this SKU so the new one can take it
      await prisma.product.delete({ where: { id: existingSku.id } }).catch(() => {});
    } else {
      throw new Error(`A product with SKU "${cleanSku}" already exists (${existingSku.name}). Please use a different SKU.`);
    }
  }

  // Check for existing product by Barcode (if provided)
  if (cleanBarcode) {
    const existingBarcode = await prisma.product.findFirst({
      where: { barcode: cleanBarcode }
    });
    if (existingBarcode) {
      if (existingBarcode.deletedAt !== null) {
        await prisma.product.delete({ where: { id: existingBarcode.id } }).catch(() => {});
      } else {
        throw new Error(`A product with barcode "${cleanBarcode}" already exists (${existingBarcode.name}).`);
      }
    }
  }

  const categoryId = await resolveCategoryId(validated.categoryId, (data as any).category);

  try {
    const result = await prisma.product.create({
      data: {
        name: validated.name.trim(),
        sku: cleanSku,
        barcode: cleanBarcode,
        categoryId,
        brandId: validated.brandId || null,
        unitId: validated.unitId || null,
        pricePerUnit: validated.pricePerUnit,
        costPrice: validated.costPrice || 0,
        stockQuantity: validated.stockQuantity,
        minStockAlert: validated.minStockAlert,
        imageUrl: validated.imageUrl || null,
        isFeatured: validated.isFeatured || false,
        metadata: {
          create: validatedMeta
        }
      }
    });

    await logAction({
      userId: user.id,
      action: 'CREATE_PRODUCT',
      entity: 'Product',
      entityId: result.id,
      details: `Created product ${result.name} (${result.sku})`,
    });

    revalidatePath('/inventory');
    revalidatePath('/pos');
    return result;
  } catch (err: any) {
    if (err.code === 'P2002') {
      throw new Error(`Unique constraint conflict: A product with this SKU or Barcode already exists.`);
    }
    throw err;
  }
}

export async function updateProduct(
  id: string,
  data: z.infer<typeof productInputSchema>,
  metadata: { key: string; value: string }[]
) {
  const user = await requireAuth();

  // Validate inputs
  const validated = productInputSchema.parse(data);
  const validatedMeta = z.array(metadataItemSchema).parse(metadata || []);

  const cleanSku = validated.sku.trim();
  const cleanBarcode = validated.barcode?.trim() || null;

  // Check if SKU is taken by another product
  const existingSku = await prisma.product.findFirst({
    where: { sku: cleanSku, id: { not: id } }
  });
  if (existingSku) {
    if (existingSku.deletedAt !== null) {
      await prisma.product.delete({ where: { id: existingSku.id } }).catch(() => {});
    } else {
      throw new Error(`A product with SKU "${cleanSku}" already exists (${existingSku.name}).`);
    }
  }

  // Check if Barcode is taken by another product
  if (cleanBarcode) {
    const existingBarcode = await prisma.product.findFirst({
      where: { barcode: cleanBarcode, id: { not: id } }
    });
    if (existingBarcode) {
      if (existingBarcode.deletedAt !== null) {
        await prisma.product.delete({ where: { id: existingBarcode.id } }).catch(() => {});
      } else {
        throw new Error(`A product with barcode "${cleanBarcode}" already exists (${existingBarcode.name}).`);
      }
    }
  }

  const categoryId = await resolveCategoryId(validated.categoryId, (data as any).category);

  try {
    const result = await prisma.product.update({
      where: { id },
      data: {
        name: validated.name.trim(),
        sku: cleanSku,
        barcode: cleanBarcode,
        categoryId,
        brandId: validated.brandId || null,
        unitId: validated.unitId || null,
        pricePerUnit: validated.pricePerUnit,
        costPrice: validated.costPrice || 0,
        stockQuantity: validated.stockQuantity,
        minStockAlert: validated.minStockAlert,
        imageUrl: validated.imageUrl || null,
        isFeatured: validated.isFeatured || false,
        metadata: {
          deleteMany: {}, // Atomically clear old metadata
          create: validatedMeta // Atomically create new metadata
        }
      }
    });

    await logAction({
      userId: user.id,
      action: 'UPDATE_PRODUCT',
      entity: 'Product',
      entityId: result.id,
      details: `Updated product ${result.name} (${result.sku})`,
    });

    revalidatePath('/inventory');
    revalidatePath('/pos');
    return result;
  } catch (err: any) {
    if (err.code === 'P2002') {
      throw new Error(`Unique constraint conflict: A product with this SKU or Barcode already exists.`);
    }
    throw err;
  }
}

export async function deleteProduct(id: string) {
  const admin = await requireAdmin();

  const salesCount = await prisma.saleItem.count({
    where: { productId: id }
  });

  let result;
  if (salesCount === 0) {
    result = await prisma.product.delete({
      where: { id }
    });
  } else {
    const now = Date.now();
    const product = await prisma.product.findUnique({ where: { id } });
    result = await prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        sku: `${product?.sku || 'sku'}_del_${now}`,
        barcode: product?.barcode ? `${product.barcode}_del_${now}` : null
      }
    });
  }
  
  await logAction({
    userId: admin.id,
    action: 'DELETE_PRODUCT',
    entity: 'Product',
    entityId: id,
    details: `Deleted product ${result.name} (${result.sku})`,
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
