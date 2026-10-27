/**
 * ============================================================
 * SET TAX RATE TO 0%
 * ============================================================
 * 
 * Updates the 'tax_rate' system setting to 0 so that future 
 * sales are processed without tax.
 * 
 * Usage:
 *   node scripts/set-tax-rate-zero.js
 * ============================================================
 */

const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  try {
    // Get current value
    const current = await prisma.setting.findUnique({
      where: { key: 'tax_rate' }
    });

    console.log(`\nCurrent tax_rate setting: ${current ? current.value + '%' : 'not set (defaults to 15%)'}`);

    // Set to 0
    await prisma.setting.upsert({
      where: { key: 'tax_rate' },
      update: { value: '0' },
      create: { key: 'tax_rate', value: '0' },
    });

    console.log('✅ tax_rate has been set to 0%');
    console.log('   All future sales will have 0% tax applied.\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
