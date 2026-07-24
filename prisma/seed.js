const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing all dummy data and initializing clean database...');

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
  await prisma.businessLocation.deleteMany({});
  await prisma.user.deleteMany({});

  const adminPassword = await bcrypt.hash('admin123', 10);
  const employeePassword = await bcrypt.hash('employee123', 10);

  // 1. Create Admin Account
  const admin = await prisma.user.create({
    data: {
      email: 'admin@store.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // 2. Create Cashier Account
  const cashier = await prisma.user.create({
    data: {
      email: 'cashier@store.com',
      password: employeePassword,
      role: 'EMPLOYEE',
    },
  });

  // 3. Create Business Location
  await prisma.businessLocation.create({
    data: {
      name: 'FRANCIS AMOAKO VENTURES (BL0001)',
      code: 'BL0001',
      address: 'Kumasi Central Market, Ghana',
    },
  });

  // 4. Create Standard Units
  await prisma.unit.createMany({
    data: [
      { name: 'Pieces', shortName: 'Pc(s)' },
      { name: 'Sheets', shortName: 'Sheet(s)' },
      { name: 'Bundles', shortName: 'Bdl' },
      { name: 'Meters', shortName: 'm' },
      { name: 'Packs', shortName: 'Pack' },
    ],
  });

  console.log('Database wiped completely clean! Ready for live store data entry.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error clearing data:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
