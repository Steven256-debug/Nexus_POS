const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3];
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;

  const client = new Client({
    connectionString: url,
    connectionTimeoutMillis: 8000,
  });

  try {
    await client.connect();

    if (!email || !newPassword) {
      console.log('\n=========================================');
      console.log('   Nexus POS & ERP - Password Reset Tool');
      console.log('=========================================\n');
      console.log('Usage:');
      console.log('  node scripts/reset-password.js <email> <newPassword>\n');
      console.log('Example:');
      console.log('  node scripts/reset-password.js admin@nexus.com NewPassword123!\n');

      console.log('Registered users currently in database:');
      const res = await client.query(
        'SELECT id, email, name, role, is_active FROM users ORDER BY "createdAt" ASC'
      );

      if (res.rows.length === 0) {
        console.log('  (No users found)');
      } else {
        res.rows.forEach(u => {
          console.log(`  - ${u.email} [${u.role}] (Name: ${u.name || 'N/A'}, Active: ${u.is_active})`);
        });
      }
      console.log('');
      process.exit(0);
    }

    if (newPassword.length < 6) {
      console.error('❌ Error: Password must be at least 6 characters long.');
      process.exit(1);
    }

    // Verify user exists
    const checkRes = await client.query('SELECT id, email, name, role FROM users WHERE email = $1', [email]);
    if (checkRes.rows.length === 0) {
      console.error(`❌ Error: User with email "${email}" was not found.`);
      process.exit(1);
    }

    const user = checkRes.rows[0];
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await client.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);

    console.log('\n=========================================');
    console.log('✅ Password successfully updated!');
    console.log('=========================================');
    console.log(`User:     ${user.email} (${user.name || 'N/A'})`);
    console.log(`Role:     ${user.role}`);
    console.log(`New Pass: ${newPassword}`);
    console.log('You can now log in at /login with these credentials.\n');
  } catch (error) {
    console.error('❌ Database error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
