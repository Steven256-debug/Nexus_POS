import { z } from 'zod';

// ─── Product Validation ───────────────────────────────────────
export const productInputSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
  pricePerUnit: z.number().positive('Price must be greater than 0'),
  costPrice: z.number().min(0, 'Cost price cannot be negative').default(0).optional(),
  stockQuantity: z.number().int().min(0, 'Stock cannot be negative').default(0),
  minStockAlert: z.number().int().min(0).default(5),
  imageUrl: z.string().optional().nullable(),
  isFeatured: z.boolean().default(false).optional(),
});

export type ProductInput = z.infer<typeof productInputSchema>;

export const metadataItemSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});

// ─── Sale Validation ──────────────────────────────────────────
export const saleItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  priceAtSale: z.number().positive('Price must be greater than 0'),
});

export const paymentSchema = z.object({
  method: z.string().min(1),
  amount: z.number().positive('Payment amount must be greater than 0'),
});

export const saleInputSchema = z.object({
  paymentMethod: z.enum(['CASH', 'MOBILE_MONEY', 'CARD', 'MULTIPLE', 'CREDIT', 'HOLD']),
  status: z.enum(['COMPLETED', 'DRAFT', 'QUOTATION']).default('COMPLETED'),
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
  payments: z.array(paymentSchema).optional(),
  customerId: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  resumedSaleId: z.string().optional(),
  discountAmount: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
});

export type SaleInput = z.infer<typeof saleInputSchema>;

// ─── Expense Validation ───────────────────────────────────────
export const expenseInputSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  description: z.string().optional().nullable(),
});

export type ExpenseInput = z.infer<typeof expenseInputSchema>;

// ─── Business Location Validation ─────────────────────────────
export const businessLocationSchema = z.object({
  name: z.string().min(1, 'Store name is required'),
  code: z.string().min(1, 'Branch code is required'),
  address: z.string().default(''),
});

export type BusinessLocationInput = z.infer<typeof businessLocationSchema>;

// ─── System Setting Validation ────────────────────────────────
export const settingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});
