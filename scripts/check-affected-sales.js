// Script to check which sales have tax_amount > 0 (affected by the 15% tax error)
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    const affectedSales = await prisma.sale.findMany({
      where: {
        taxAmount: { gt: 0 }
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\n========================================`);
    console.log(`AFFECTED SALES REPORT (tax_amount > 0)`);
    console.log(`========================================`);
    console.log(`Total affected sales: ${affectedSales.length}\n`);

    let totalTaxToRemove = 0;

    for (const sale of affectedSales) {
      const subtotal = sale.items.reduce((sum, item) => sum + (item.priceAtSale * item.quantity), 0);
      const netWithoutTax = subtotal - sale.discountAmount;
      const correctedTotal = netWithoutTax; // total without tax
      const currentTotal = subtotal - sale.discountAmount + sale.taxAmount;
      
      console.log(`Invoice: ${sale.invoiceNo}`);
      console.log(`  Status: ${sale.status}`);
      console.log(`  Date: ${sale.createdAt}`);
      console.log(`  Subtotal (items): GH₵${subtotal.toFixed(2)}`);
      console.log(`  Discount: GH₵${sale.discountAmount.toFixed(2)}`);
      console.log(`  Tax (WRONG): GH₵${sale.taxAmount.toFixed(2)}`);
      console.log(`  Current Total: GH₵${currentTotal.toFixed(2)}`);
      console.log(`  Corrected Total: GH₵${correctedTotal.toFixed(2)}`);
      console.log(`  Paid Amount: GH₵${sale.paidAmount.toFixed(2)}`);
      console.log(`  Change Amount: GH₵${sale.changeAmount.toFixed(2)}`);
      console.log(`  Payment Method: ${sale.paymentMethod}`);
      console.log(`  ---`);
      
      totalTaxToRemove += sale.taxAmount;
    }

    console.log(`\n========================================`);
    console.log(`SUMMARY`);
    console.log(`========================================`);
    console.log(`Total tax amount to remove: GH₵${totalTaxToRemove.toFixed(2)}`);
    console.log(`Number of affected sales: ${affectedSales.length}`);
    console.log(`========================================\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
