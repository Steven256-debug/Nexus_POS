const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function addIndexes() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  const client = new Client({ connectionString: url, connectionTimeoutMillis: 10000 });

  try {
    await client.connect();
    console.log('Connected! Adding missing indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS "customers_group_id_fk_idx" ON "customers"("group_id_fk")',
      'CREATE INDEX IF NOT EXISTS "product_metadata_product_id_fk_idx" ON "product_metadata"("product_id_fk")',
      'CREATE INDEX IF NOT EXISTS "sale_items_sale_id_fk_idx" ON "sale_items"("sale_id_fk")',
      'CREATE INDEX IF NOT EXISTS "sale_items_product_id_fk_idx" ON "sale_items"("product_id_fk")',
      'CREATE INDEX IF NOT EXISTS "payments_sale_id_fk_idx" ON "payments"("sale_id_fk")',
      'CREATE INDEX IF NOT EXISTS "expenses_user_id_fk_idx" ON "expenses"("user_id_fk")',
      'CREATE INDEX IF NOT EXISTS "variation_options_template_id_fk_idx" ON "variation_options"("template_id_fk")',
      'CREATE INDEX IF NOT EXISTS "returns_sale_id_fk_idx" ON "returns"("sale_id_fk")',
      'CREATE INDEX IF NOT EXISTS "returns_user_id_fk_idx" ON "returns"("user_id_fk")',
      'CREATE INDEX IF NOT EXISTS "return_items_return_id_fk_idx" ON "return_items"("return_id_fk")',
      'CREATE INDEX IF NOT EXISTS "return_items_sale_item_id_fk_idx" ON "return_items"("sale_item_id_fk")',
      'CREATE INDEX IF NOT EXISTS "audit_logs_user_id_fk_idx" ON "audit_logs"("user_id_fk")',
      'CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx" ON "audit_logs"("createdAt")',
    ];

    for (const sql of indexes) {
      await client.query(sql);
      console.log('  ✅', sql.split('"')[1]);
    }

    console.log('✅ All indexes created successfully!');
  } catch (err) {
    console.error('❌ Failed:', err.message);
  } finally {
    await client.end();
  }
}

addIndexes();
