const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function testConnection() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  console.log('Testing connection to:', url.replace(/:[^:@]+@/, ':***@'));
  
  const client = new Client({
    connectionString: url,
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    console.log('✅ Connection successful!');
    const res = await client.query('SELECT NOW()');
    console.log('Time on server:', res.rows[0].now);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  } finally {
    await client.end();
  }
}

testConnection();
