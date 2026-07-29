const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

async function runSQL() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  const client = new Client({
    connectionString: url,
    connectionTimeoutMillis: 10000
  });

  try {
    await client.connect();
    console.log('Connected! Executing schema...');
    
    const sql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf-8');
    await client.query(sql);
    
    console.log('✅ Tables created successfully!');
  } catch (err) {
    console.error('❌ Failed:', err.message);
  } finally {
    await client.end();
  }
}

runSQL();
