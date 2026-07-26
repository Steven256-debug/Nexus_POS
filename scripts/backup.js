const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Configuration
const DB_FILE = path.join(__dirname, '..', 'prisma', 'dev.db');
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const RETENTION_DAYS = 30;

async function runBackup() {
  console.log('--- Nexus POS Automated Backup ---');
  
  if (!fs.existsSync(DB_FILE)) {
    console.error('❌ Database file not found at:', DB_FILE);
    process.exit(1);
  }

  // Ensure backup directory exists
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`✅ Created backup directory at ${BACKUP_DIR}`);
  }

  // Generate timestamped filename
  const now = new Date();
  const timestamp = now.toISOString().replace(/T/, '-').replace(/:/g, '').split('.')[0];
  const backupFileName = `nexus-pos-db-${timestamp}.db.gz`;
  const backupFilePath = path.join(BACKUP_DIR, backupFileName);

  console.log(`📦 Compressing and backing up database to: ${backupFileName}...`);

  try {
    // Stream read DB -> Gzip compress -> Stream write Backup
    const readStream = fs.createReadStream(DB_FILE);
    const writeStream = fs.createWriteStream(backupFilePath);
    const gzip = zlib.createGzip();

    await new Promise((resolve, reject) => {
      readStream.pipe(gzip).pipe(writeStream)
        .on('finish', resolve)
        .on('error', reject);
    });

    const stats = fs.statSync(backupFilePath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`✅ Backup successful! Size: ${sizeMB} MB`);

    // Cleanup old backups
    cleanupOldBackups();
  } catch (err) {
    console.error('❌ Backup failed:', err);
    process.exit(1);
  }
}

function cleanupOldBackups() {
  console.log(`\n🧹 Checking for backups older than ${RETENTION_DAYS} days...`);
  
  const files = fs.readdirSync(BACKUP_DIR);
  const nowTime = Date.now();
  let deletedCount = 0;

  for (const file of files) {
    // Only process .gz files
    if (!file.endsWith('.gz')) continue;

    const filePath = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(filePath);
    
    // Calculate age in days
    const ageDays = (nowTime - stats.mtimeMs) / (1000 * 60 * 60 * 24);

    if (ageDays > RETENTION_DAYS) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted old backup: ${file} (${ageDays.toFixed(1)} days old)`);
      deletedCount++;
    }
  }

  if (deletedCount === 0) {
    console.log('✨ All backups are within the retention period. No cleanup needed.');
  }
  console.log('--- Backup Process Complete ---');
}

runBackup();
