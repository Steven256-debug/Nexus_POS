const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old data and initializing Drinks & Mineral Water POS Database...');

  // Delete all existing data from tables in reverse order of relations
  await prisma.payment.deleteMany({});
  await prisma.returnItem.deleteMany({});
  await prisma.return.deleteMany({});
  await prisma.saleItem.deleteMany({});
  await prisma.sale.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.productMetadata.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.customerGroup.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.brand.deleteMany({});
  await prisma.unit.deleteMany({});
  await prisma.variationOption.deleteMany({});
  await prisma.variationTemplate.deleteMany({});
  await prisma.setting.deleteMany({});
  await prisma.businessLocation.deleteMany({});
  await prisma.user.deleteMany({});

  const adminPassword = await bcrypt.hash('admin123', 10);
  const employeePassword = await bcrypt.hash('employee123', 10);

  // 1. Create Admin Account
  await prisma.user.create({
    data: {
      email: 'admin@store.com',
      name: 'Admin Manager',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // 2. Create Cashier Account
  await prisma.user.create({
    data: {
      email: 'cashier@store.com',
      name: 'Cashier Staff',
      password: employeePassword,
      role: 'EMPLOYEE',
    },
  });

  // 3. Create Business Location
  await prisma.businessLocation.create({
    data: {
      name: 'AMOAKO DRINKS & WATER DEPOT (BL0001)',
      code: 'BL0001',
      address: 'Kumasi Central Market, Ghana',
    },
  });

  // 4. Create Standard Packaging Units
  const units = await Promise.all([
    prisma.unit.create({ data: { name: 'Packs', shortName: 'Pack' } }),
    prisma.unit.create({ data: { name: 'Cartons', shortName: 'Ctn' } }),
    prisma.unit.create({ data: { name: 'Crates', shortName: 'Crate' } }),
    prisma.unit.create({ data: { name: 'Bags', shortName: 'Bag' } }),
    prisma.unit.create({ data: { name: 'Bottles', shortName: 'Btl' } }),
    prisma.unit.create({ data: { name: 'Cans', shortName: 'Can' } }),
    prisma.unit.create({ data: { name: 'Pieces', shortName: 'Pc(s)' } }),
  ]);
  const unitMap = Object.fromEntries(units.map(u => [u.name, u.id]));

  // 5. Create Drinks & Water Categories
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Mineral & Bottled Water' } }),
    prisma.category.create({ data: { name: 'Sachet Water' } }),
    prisma.category.create({ data: { name: 'Carbonated Soft Drinks' } }),
    prisma.category.create({ data: { name: 'Energy Drinks' } }),
    prisma.category.create({ data: { name: 'Fruit Juices & Nectars' } }),
    prisma.category.create({ data: { name: 'Malt Drinks' } }),
    prisma.category.create({ data: { name: 'Flavored & Sparkling Drinks' } }),
  ]);
  const catMap = Object.fromEntries(categories.map(c => [c.name, c.id]));

  // 6. Create Brands
  const brands = await Promise.all([
    prisma.brand.create({ data: { name: 'Voltic' } }),
    prisma.brand.create({ data: { name: 'Bel-Aqua' } }),
    prisma.brand.create({ data: { name: 'Awake' } }),
    prisma.brand.create({ data: { name: 'Coca-Cola' } }),
    prisma.brand.create({ data: { name: 'Malta Guinness' } }),
    prisma.brand.create({ data: { name: 'Alvaro' } }),
    prisma.brand.create({ data: { name: 'Storm Energy' } }),
    prisma.brand.create({ data: { name: 'Rush Energy' } }),
    prisma.brand.create({ data: { name: 'Ceres' } }),
    prisma.brand.create({ data: { name: 'Don Simon' } }),
    prisma.brand.create({ data: { name: 'Tampico' } }),
  ]);
  const brandMap = Object.fromEntries(brands.map(b => [b.name, b.id]));

  // 7. Create Customer Pricing Groups
  const wholesaleGroup = await prisma.customerGroup.create({
    data: { name: 'Wholesale Depot Buyer', discount: 5.0 },
  });
  await prisma.customerGroup.create({
    data: { name: 'Retail Customer', discount: 0.0 },
  });

  // 8. Create Sample Customers
  await prisma.customer.create({
    data: {
      name: 'Kofi Mensah (Retail Mart)',
      phone: '0244123456',
      groupId: wholesaleGroup.id,
      creditLimit: 5000,
    },
  });

  // 9. Create Products
  const products = [
    {
      name: 'Voltic Natural Mineral Water 500ml (Pack of 16)',
      sku: 'WAT-VOL-500',
      barcode: '060012345001',
      pricePerUnit: 35.0,
      costPrice: 28.0,
      stockQuantity: 150,
      minStockAlert: 20,
      isFeatured: true,
      categoryId: catMap['Mineral & Bottled Water'],
      brandId: brandMap['Voltic'],
      unitId: unitMap['Packs'],
    },
    {
      name: 'Voltic Natural Mineral Water 1.5L (Pack of 6)',
      sku: 'WAT-VOL-1500',
      barcode: '060012345002',
      pricePerUnit: 38.0,
      costPrice: 30.0,
      stockQuantity: 120,
      minStockAlert: 15,
      isFeatured: true,
      categoryId: catMap['Mineral & Bottled Water'],
      brandId: brandMap['Voltic'],
      unitId: unitMap['Packs'],
    },
    {
      name: 'Bel-Aqua Mineral Water 750ml (Pack of 12)',
      sku: 'WAT-BEL-750',
      barcode: '060012345003',
      pricePerUnit: 32.0,
      costPrice: 25.0,
      stockQuantity: 140,
      minStockAlert: 20,
      isFeatured: false,
      categoryId: catMap['Mineral & Bottled Water'],
      brandId: brandMap['Bel-Aqua'],
      unitId: unitMap['Packs'],
    },
    {
      name: 'Awake Purified Drinking Water 500ml (Pack of 16)',
      sku: 'WAT-AWK-500',
      barcode: '060012345004',
      pricePerUnit: 34.0,
      costPrice: 27.0,
      stockQuantity: 100,
      minStockAlert: 15,
      isFeatured: false,
      categoryId: catMap['Mineral & Bottled Water'],
      brandId: brandMap['Awake'],
      unitId: unitMap['Packs'],
    },
    {
      name: 'Ice Cool Pure Sachet Water (Bag of 30 sachets)',
      sku: 'WAT-SAC-BAG',
      barcode: '060012345005',
      pricePerUnit: 12.0,
      costPrice: 8.5,
      stockQuantity: 300,
      minStockAlert: 50,
      isFeatured: true,
      categoryId: catMap['Sachet Water'],
      brandId: brandMap['Bel-Aqua'],
      unitId: unitMap['Bags'],
    },
    {
      name: 'Coca-Cola 330ml Can (Carton of 24)',
      sku: 'SDA-COK-330',
      barcode: '060012345006',
      pricePerUnit: 180.0,
      costPrice: 155.0,
      stockQuantity: 80,
      minStockAlert: 10,
      isFeatured: true,
      categoryId: catMap['Carbonated Soft Drinks'],
      brandId: brandMap['Coca-Cola'],
      unitId: unitMap['Cartons'],
    },
    {
      name: 'Coca-Cola Original 500ml PET (Pack of 12)',
      sku: 'SDA-COK-500',
      barcode: '060012345007',
      pricePerUnit: 95.0,
      costPrice: 80.0,
      stockQuantity: 90,
      minStockAlert: 15,
      isFeatured: true,
      categoryId: catMap['Carbonated Soft Drinks'],
      brandId: brandMap['Coca-Cola'],
      unitId: unitMap['Packs'],
    },
    {
      name: 'Fanta Orange 500ml PET (Pack of 12)',
      sku: 'SDA-FAN-500',
      barcode: '060012345008',
      pricePerUnit: 95.0,
      costPrice: 80.0,
      stockQuantity: 75,
      minStockAlert: 12,
      isFeatured: false,
      categoryId: catMap['Carbonated Soft Drinks'],
      brandId: brandMap['Coca-Cola'],
      unitId: unitMap['Packs'],
    },
    {
      name: 'Sprite 500ml PET (Pack of 12)',
      sku: 'SDA-SPR-500',
      barcode: '060012345009',
      pricePerUnit: 95.0,
      costPrice: 80.0,
      stockQuantity: 70,
      minStockAlert: 12,
      isFeatured: false,
      categoryId: catMap['Carbonated Soft Drinks'],
      brandId: brandMap['Coca-Cola'],
      unitId: unitMap['Packs'],
    },
    {
      name: 'Malta Guinness 330ml Can (Pack of 24)',
      sku: 'MLT-GUI-330',
      barcode: '060012345010',
      pricePerUnit: 210.0,
      costPrice: 185.0,
      stockQuantity: 60,
      minStockAlert: 10,
      isFeatured: true,
      categoryId: catMap['Malt Drinks'],
      brandId: brandMap['Malta Guinness'],
      unitId: unitMap['Packs'],
    },
    {
      name: 'Malta Guinness Returnable Bottle (Crate of 24)',
      sku: 'MLT-GUI-BTL',
      barcode: '060012345011',
      pricePerUnit: 160.0,
      costPrice: 140.0,
      stockQuantity: 50,
      minStockAlert: 10,
      isFeatured: false,
      categoryId: catMap['Malt Drinks'],
      brandId: brandMap['Malta Guinness'],
      unitId: unitMap['Crates'],
    },
    {
      name: 'Alvaro Pear 330ml Can (Pack of 24)',
      sku: 'MLT-ALV-330',
      barcode: '060012345012',
      pricePerUnit: 175.0,
      costPrice: 150.0,
      stockQuantity: 65,
      minStockAlert: 10,
      isFeatured: false,
      categoryId: catMap['Malt Drinks'],
      brandId: brandMap['Alvaro'],
      unitId: unitMap['Packs'],
    },
    {
      name: 'Storm Energy Drink 330ml (Pack of 24)',
      sku: 'ENG-STM-330',
      barcode: '060012345013',
      pricePerUnit: 140.0,
      costPrice: 118.0,
      stockQuantity: 110,
      minStockAlert: 20,
      isFeatured: true,
      categoryId: catMap['Energy Drinks'],
      brandId: brandMap['Storm Energy'],
      unitId: unitMap['Packs'],
    },
    {
      name: 'Rush Energy Drink 330ml (Pack of 24)',
      sku: 'ENG-RSH-330',
      barcode: '060012345014',
      pricePerUnit: 135.0,
      costPrice: 115.0,
      stockQuantity: 95,
      minStockAlert: 15,
      isFeatured: false,
      categoryId: catMap['Energy Drinks'],
      brandId: brandMap['Rush Energy'],
      unitId: unitMap['Packs'],
    },
    {
      name: 'Ceres 100% Fruit Juice 1L (Carton of 12)',
      sku: 'JCE-CER-1000',
      barcode: '060012345015',
      pricePerUnit: 260.0,
      costPrice: 225.0,
      stockQuantity: 45,
      minStockAlert: 8,
      isFeatured: true,
      categoryId: catMap['Fruit Juices & Nectars'],
      brandId: brandMap['Ceres'],
      unitId: unitMap['Cartons'],
    },
    {
      name: 'Don Simon Multifrutas Juice 1L (Carton of 12)',
      sku: 'JCE-DNS-1000',
      barcode: '060012345016',
      pricePerUnit: 215.0,
      costPrice: 185.0,
      stockQuantity: 55,
      minStockAlert: 10,
      isFeatured: false,
      categoryId: catMap['Fruit Juices & Nectars'],
      brandId: brandMap['Don Simon'],
      unitId: unitMap['Cartons'],
    },
    {
      name: 'Tampico Citrus Punch 1L (Pack of 6)',
      sku: 'JCE-TAM-1000',
      barcode: '060012345017',
      pricePerUnit: 85.0,
      costPrice: 70.0,
      stockQuantity: 60,
      minStockAlert: 10,
      isFeatured: false,
      categoryId: catMap['Fruit Juices & Nectars'],
      brandId: brandMap['Tampico'],
      unitId: unitMap['Packs'],
    },
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }

  // 10. Default Settings
  await prisma.setting.createMany({
    data: [
      { key: 'tax_rate', value: '15' },
      { key: 'currency', value: 'GH₵' },
      { key: 'invoice_prefix', value: 'INV' },
      { key: 'business_name', value: 'AMOAKO DRINKS & WATER DEPOT' },
      { key: 'printer_width', value: '80mm' },
    ],
  });

  console.log('🎉 Drinks & Water database initialized successfully!');
  console.log('Categories: Mineral Water, Sachet Water, Soft Drinks, Energy Drinks, Juices, Malt Drinks');
  console.log('Admin: admin@store.com / admin123');
  console.log('Cashier: cashier@store.com / employee123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error seeding data:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
