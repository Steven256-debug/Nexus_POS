const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const employeePassword = await bcrypt.hash('employee123', 10);

  // Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@store.com' },
    update: {},
    create: {
      email: 'admin@store.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Employee User
  const employee = await prisma.user.upsert({
    where: { email: 'cashier@store.com' },
    update: {},
    create: {
      email: 'cashier@store.com',
      password: employeePassword,
      role: 'EMPLOYEE',
    },
  });

  console.log('Seeded database with users:', { admin, employee });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
