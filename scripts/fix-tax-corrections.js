/**
 * ============================================================
 * TAX CORRECTION SCRIPT
 * ============================================================
 * 
 * Purpose: Fix sales transactions that were incorrectly charged
 *          with a 15% tax when the tax should have been 0%.
 * 
 * What it does:
 *   1. Finds all sales where tax_amount > 0
 *   2. For each affected sale:
 *      - Sets tax_amount to 0
 *      - Recalculates change_amount (paidAmount - correctedTotal)
 *      - Logs the correction in the audit_logs table
 *   3. Prints a before/after report
 * 
 * Usage:
 *   node scripts/fix-tax-corrections.js           (dry run, no changes)
 *   node scripts/fix-tax-corrections.js --apply    (apply corrections)
 * 
 * IMPORTANT: Run with no flags first (dry run) to review changes!
 * ============================================================
 */

const { PrismaClient } = require('@prisma/client');

const DRY_RUN = !process.argv.includes('--apply');

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  TAX CORRECTION SCRIPT`);
    console.log(`  Mode: ${DRY_RUN ? '🔍 DRY RUN (no changes will be made)' : '⚡ APPLYING CORRECTIONS'}`);
    console.log(`${'='.repeat(60)}\n`);

    // 1. Find all affected sales (tax_amount > 0)
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

    if (affectedSales.length === 0) {
      console.log('✅ No sales found with tax_amount > 0. Nothing to fix!\n');
      return;
    }

    console.log(`Found ${affectedSales.length} sale(s) with incorrect tax.\n`);

    let totalTaxRemoved = 0;
    let totalChangeAdjusted = 0;
    const corrections = [];

    // 2. Calculate corrections for each sale
    for (const sale of affectedSales) {
      const subtotal = sale.items.reduce(
        (sum, item) => sum + (Number(item.priceAtSale) * item.quantity), 0
      );
      const discountAmount = Number(sale.discountAmount);
      const oldTaxAmount = Number(sale.taxAmount);
      const paidAmount = Number(sale.paidAmount);
      const oldChangeAmount = Number(sale.changeAmount);

      // Corrected values: tax = 0
      const newTaxAmount = 0;
      const correctedTotal = subtotal - discountAmount + newTaxAmount;
      const newChangeAmount = Math.max(0, paidAmount - correctedTotal);

      const correction = {
        id: sale.id,
        invoiceNo: sale.invoiceNo,
        status: sale.status,
        createdAt: sale.createdAt,
        subtotal,
        discountAmount,
        oldTaxAmount,
        newTaxAmount,
        oldTotal: subtotal - discountAmount + oldTaxAmount,
        newTotal: correctedTotal,
        paidAmount,
        oldChangeAmount,
        newChangeAmount,
        taxDifference: oldTaxAmount - newTaxAmount,
        changeDifference: newChangeAmount - oldChangeAmount,
      };

      corrections.push(correction);
      totalTaxRemoved += correction.taxDifference;
      totalChangeAdjusted += correction.changeDifference;
    }

    // 3. Print detailed report
    console.log(`${'─'.repeat(60)}`);
    console.log(`  DETAILED CORRECTIONS`);
    console.log(`${'─'.repeat(60)}`);

    for (const c of corrections) {
      console.log(`\n  📋 ${c.invoiceNo} (${c.status})`);
      console.log(`     Date:       ${new Date(c.createdAt).toLocaleString()}`);
      console.log(`     Subtotal:   GH₵${c.subtotal.toFixed(2)}`);
      console.log(`     Discount:   GH₵${c.discountAmount.toFixed(2)}`);
      console.log(`     Tax:        GH₵${c.oldTaxAmount.toFixed(2)}  →  GH₵${c.newTaxAmount.toFixed(2)}`);
      console.log(`     Total:      GH₵${c.oldTotal.toFixed(2)}  →  GH₵${c.newTotal.toFixed(2)}`);
      console.log(`     Paid:       GH₵${c.paidAmount.toFixed(2)}`);
      console.log(`     Change:     GH₵${c.oldChangeAmount.toFixed(2)}  →  GH₵${c.newChangeAmount.toFixed(2)}`);
    }

    console.log(`\n${'─'.repeat(60)}`);
    console.log(`  SUMMARY`);
    console.log(`${'─'.repeat(60)}`);
    console.log(`  Affected sales:        ${corrections.length}`);
    console.log(`  Total tax removed:     GH₵${totalTaxRemoved.toFixed(2)}`);
    console.log(`  Total change adjusted: GH₵${totalChangeAdjusted.toFixed(2)}`);
    console.log(`${'─'.repeat(60)}\n`);

    // 4. Apply corrections if --apply flag is set
    if (DRY_RUN) {
      console.log('🔍 DRY RUN complete. No changes were made to the database.');
      console.log('   To apply these corrections, run:');
      console.log('   node scripts/fix-tax-corrections.js --apply\n');
      return;
    }

    // Apply in a single transaction for atomicity
    console.log('⏳ Applying corrections...\n');

    await prisma.$transaction(async (tx) => {
      for (const c of corrections) {
        // Update the sale record
        await tx.sale.update({
          where: { id: c.id },
          data: {
            taxAmount: c.newTaxAmount,
            changeAmount: c.newChangeAmount,
          }
        });

        // Create an audit log entry for traceability
        await tx.auditLog.create({
          data: {
            action: 'TAX_CORRECTION',
            entity: 'Sale',
            entityId: c.id,
            details: JSON.stringify({
              invoiceNo: c.invoiceNo,
              reason: 'Removed incorrect 15% tax — should have been 0%',
              before: {
                taxAmount: c.oldTaxAmount,
                changeAmount: c.oldChangeAmount,
                total: c.oldTotal,
              },
              after: {
                taxAmount: c.newTaxAmount,
                changeAmount: c.newChangeAmount,
                total: c.newTotal,
              },
              correctedAt: new Date().toISOString(),
            }),
          }
        });

        console.log(`  ✅ ${c.invoiceNo} — tax GH₵${c.oldTaxAmount.toFixed(2)} → GH₵0.00`);
      }
    });

    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ✅ ALL ${corrections.length} SALE(S) CORRECTED SUCCESSFULLY`);
    console.log(`  📝 Audit log entries created for each correction`);
    console.log(`${'='.repeat(60)}\n`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('   No changes were applied (transaction rolled back).\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
