const { PrismaClient } = require('@prisma/client');
async function main() {
  const prisma = new PrismaClient();
  try {
    const bizName = await prisma.setting.findUnique({ where: { key: 'business_name' } });
    const locations = await prisma.businessLocation.findMany();
    console.log('business_name setting:', bizName);
    console.log('business locations:', JSON.stringify(locations, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}
main();
