const { PrismaClient } = require('@prisma/client');
async function main() {
  const prisma = new PrismaClient();
  try {
    // Update business_name setting
    await prisma.setting.upsert({
      where: { key: 'business_name' },
      update: { value: "BB'S Enterprise" },
      create: { key: 'business_name', value: "BB'S Enterprise" },
    });
    console.log("✅ business_name setting updated to: BB'S Enterprise");

    // Update business location name
    await prisma.businessLocation.update({
      where: { id: 'c0ab3686-e5e8-4ca9-837a-394e4edb8c5f' },
      data: { name: "BB'S Enterprise (BL0001)" },
    });
    console.log("✅ Business location name updated to: BB'S Enterprise (BL0001)");
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
