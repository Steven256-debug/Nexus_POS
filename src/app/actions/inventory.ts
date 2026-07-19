'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getProducts() {
  return await prisma.product.findMany({
    include: {
      metadata: true
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
      metadata: true
    }
  });
}

export async function createProduct(data: any, metadata: {key: string, value: string}[]) {
  const result = await prisma.product.create({
    data: {
      name: data.name,
      sku: data.sku,
      category: data.category,
      pricePerUnit: data.pricePerUnit,
      stockQuantity: data.stockQuantity,
      minStockAlert: data.minStockAlert,
      imageUrl: data.imageUrl,
      metadata: {
        create: metadata
      }
    }
  });
  revalidatePath('/inventory');
  return result;
}

export async function updateProduct(id: string, data: any, metadata: {key: string, value: string}[]) {
  await prisma.productMetadata.deleteMany({
    where: { productId: id }
  });
  
  const result = await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      sku: data.sku,
      category: data.category,
      pricePerUnit: data.pricePerUnit,
      stockQuantity: data.stockQuantity,
      minStockAlert: data.minStockAlert,
      imageUrl: data.imageUrl,
      metadata: {
        create: metadata
      }
    }
  });
  revalidatePath('/inventory');
  return result;
}

export async function deleteProduct(id: string) {
  await prisma.productMetadata.deleteMany({
    where: { productId: id }
  });
  const result = await prisma.product.delete({
    where: { id }
  });
  revalidatePath('/inventory');
  return result;
}

export async function importProductsBatch(products: any[]) {
  const result = await prisma.$transaction(
    products.map(p => prisma.product.create({
      data: {
        name: p.name,
        sku: p.sku,
        category: p.category,
        pricePerUnit: Number(p.pricePerUnit),
        stockQuantity: Number(p.stockQuantity),
        minStockAlert: Number(p.minStockAlert),
        imageUrl: p.imageUrl || null
      }
    }))
  );
  revalidatePath('/inventory');
  return result;
}
