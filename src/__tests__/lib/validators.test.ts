import {
  productInputSchema,
  saleInputSchema,
  expenseInputSchema,
  businessLocationSchema,
  returnInputSchema,
  userInputSchema,
} from '@/lib/validators';

// ─── Product Validation ──────────────────────────────────────────
describe('productInputSchema', () => {
  const validProduct = {
    name: 'Aluzinc Sheet T.16',
    sku: 'ALZ-016',
    pricePerUnit: 120.50,
    stockQuantity: 100,
  };

  test('accepts valid product', () => {
    const result = productInputSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  test('rejects missing name', () => {
    const result = productInputSchema.safeParse({ ...validProduct, name: '' });
    expect(result.success).toBe(false);
  });

  test('rejects missing SKU', () => {
    const result = productInputSchema.safeParse({ ...validProduct, sku: '' });
    expect(result.success).toBe(false);
  });

  test('rejects zero price', () => {
    const result = productInputSchema.safeParse({ ...validProduct, pricePerUnit: 0 });
    expect(result.success).toBe(false);
  });

  test('rejects negative price', () => {
    const result = productInputSchema.safeParse({ ...validProduct, pricePerUnit: -10 });
    expect(result.success).toBe(false);
  });

  test('rejects negative stock', () => {
    const result = productInputSchema.safeParse({ ...validProduct, stockQuantity: -5 });
    expect(result.success).toBe(false);
  });

  test('accepts optional fields as null', () => {
    const result = productInputSchema.safeParse({
      ...validProduct,
      barcode: null,
      categoryId: null,
      brandId: null,
      unitId: null,
      imageUrl: null,
    });
    expect(result.success).toBe(true);
  });

  test('defaults costPrice to 0', () => {
    const result = productInputSchema.parse(validProduct);
    expect(result.costPrice).toBe(0);
  });

  test('defaults minStockAlert to 5', () => {
    const result = productInputSchema.parse(validProduct);
    expect(result.minStockAlert).toBe(5);
  });
});

// ─── Sale Validation ─────────────────────────────────────────────
describe('saleInputSchema', () => {
  const validSale = {
    paymentMethod: 'CASH' as const,
    items: [{ productId: 'abc-123', quantity: 2, priceAtSale: 50 }],
    discountAmount: 0,
    taxAmount: 7.5,
  };

  test('accepts valid sale', () => {
    const result = saleInputSchema.safeParse(validSale);
    expect(result.success).toBe(true);
  });

  test('rejects empty items', () => {
    const result = saleInputSchema.safeParse({ ...validSale, items: [] });
    expect(result.success).toBe(false);
  });

  test('rejects invalid payment method', () => {
    const result = saleInputSchema.safeParse({ ...validSale, paymentMethod: 'BITCOIN' });
    expect(result.success).toBe(false);
  });

  test('rejects zero quantity', () => {
    const result = saleInputSchema.safeParse({
      ...validSale,
      items: [{ productId: 'abc-123', quantity: 0, priceAtSale: 50 }],
    });
    expect(result.success).toBe(false);
  });

  test('rejects negative discount', () => {
    const result = saleInputSchema.safeParse({ ...validSale, discountAmount: -10 });
    expect(result.success).toBe(false);
  });

  test('accepts MULTIPLE payment method with payments array', () => {
    const result = saleInputSchema.safeParse({
      ...validSale,
      paymentMethod: 'MULTIPLE',
      payments: [
        { method: 'CASH', amount: 30 },
        { method: 'MOBILE_MONEY', amount: 20 },
      ],
    });
    expect(result.success).toBe(true);
  });

  test('defaults status to COMPLETED', () => {
    const result = saleInputSchema.parse(validSale);
    expect(result.status).toBe('COMPLETED');
  });
});

// ─── Return Validation ───────────────────────────────────────────
describe('returnInputSchema', () => {
  test('accepts valid return', () => {
    const result = returnInputSchema.safeParse({
      saleId: 'sale-123',
      items: [{ saleItemId: 'item-1', quantity: 1, condition: 'GOOD' }],
    });
    expect(result.success).toBe(true);
  });

  test('rejects empty items', () => {
    const result = returnInputSchema.safeParse({
      saleId: 'sale-123',
      items: [],
    });
    expect(result.success).toBe(false);
  });

  test('rejects invalid condition', () => {
    const result = returnInputSchema.safeParse({
      saleId: 'sale-123',
      items: [{ saleItemId: 'item-1', quantity: 1, condition: 'BROKEN' }],
    });
    expect(result.success).toBe(false);
  });
});

// ─── User Validation ─────────────────────────────────────────────
describe('userInputSchema', () => {
  test('accepts valid user', () => {
    const result = userInputSchema.safeParse({
      name: 'John Doe',
      email: 'john@store.com',
      password: 'securePassword123',
      role: 'EMPLOYEE',
    });
    expect(result.success).toBe(true);
  });

  test('rejects invalid email', () => {
    const result = userInputSchema.safeParse({
      name: 'John',
      email: 'not-an-email',
      role: 'EMPLOYEE',
    });
    expect(result.success).toBe(false);
  });

  test('rejects short password', () => {
    const result = userInputSchema.safeParse({
      name: 'John',
      email: 'john@store.com',
      password: '123',
      role: 'EMPLOYEE',
    });
    expect(result.success).toBe(false);
  });

  test('rejects invalid role', () => {
    const result = userInputSchema.safeParse({
      name: 'John',
      email: 'john@store.com',
      role: 'SUPERADMIN',
    });
    expect(result.success).toBe(false);
  });
});

// ─── Expense Validation ──────────────────────────────────────────
describe('expenseInputSchema', () => {
  test('accepts valid expense', () => {
    const result = expenseInputSchema.safeParse({
      category: 'Transportation',
      amount: 50,
    });
    expect(result.success).toBe(true);
  });

  test('rejects zero amount', () => {
    const result = expenseInputSchema.safeParse({
      category: 'Transportation',
      amount: 0,
    });
    expect(result.success).toBe(false);
  });

  test('rejects empty category', () => {
    const result = expenseInputSchema.safeParse({
      category: '',
      amount: 50,
    });
    expect(result.success).toBe(false);
  });
});

// ─── Business Location Validation ────────────────────────────────
describe('businessLocationSchema', () => {
  test('accepts valid location', () => {
    const result = businessLocationSchema.safeParse({
      name: 'Francis Amoako Ventures',
      code: 'BL0001',
    });
    expect(result.success).toBe(true);
  });

  test('rejects missing name', () => {
    const result = businessLocationSchema.safeParse({
      name: '',
      code: 'BL0001',
    });
    expect(result.success).toBe(false);
  });

  test('rejects missing code', () => {
    const result = businessLocationSchema.safeParse({
      name: 'Store',
      code: '',
    });
    expect(result.success).toBe(false);
  });
});
