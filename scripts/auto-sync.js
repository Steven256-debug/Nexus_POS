const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DEBOUNCE_MS = 5000;

let syncTimer = null;
let isSyncing = false;

function log(msg) {
  const time = new Date().toLocaleTimeString();
  console.log(`[Auto-Sync ${time}] ${msg}`);
}

function runGitCommand(cmd) {
  try {
    return execSync(cmd, { cwd: PROJECT_ROOT, stdio: 'pipe' }).toString().trim();
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString() : err.message;
    throw new Error(stderr);
  }
}

function syncToGitHub() {
  if (isSyncing) {
    log('Sync already in progress. Retrying shortly...');
    scheduleSync();
    return;
  }

  isSyncing = true;
  try {
    const status = runGitCommand('git status --porcelain');
    if (!status) {
      log('No changes detected to sync.');
      isSyncing = false;
      return;
    }

    log('Changes detected. Staging files...');
    runGitCommand('git add .');

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const commitMessage = `Auto-sync: updates from Antigravity IDE (${timestamp})`;
    log(`Committing: "${commitMessage}"`);
    runGitCommand(`git commit -m "${commitMessage}"`);

    log('Pushing to GitHub (origin main)...');
    const pushOutput = runGitCommand('git push origin main');
    log('Successfully pushed changes to GitHub repo!');
  } catch (error) {
    log(`Sync error: ${error.message.trim()}`);
  } finally {
    isSyncing = false;
  }
}

function scheduleSync() {
  if (syncTimer) {
    clearTimeout(syncTimer);
  }
  syncTimer = setTimeout(() => {
    syncToGitHub();
  }, DEBOUNCE_MS);
}

function shouldIgnore(filePath) {
  const relativePath = path.relative(PROJECT_ROOT, filePath);
  if (!relativePath) return false;
  
  const ignoredPatterns = [
    /^\.git/,
    /^node_modules/,
    /^\.next/,
    /\.db$/,
    /\.log$/,
    /^\.env/
  ];

  return ignoredPatterns.some(pattern => pattern.test(relativePath));
}

log('Starting Nexus POS GitHub Auto-Sync Watcher...');
log(`Monitoring changes in: ${PROJECT_ROOT}`);

fs.watch(PROJECT_ROOT, { recursive: true }, (eventType, filename) => {
  if (!filename) return;
  if (shouldIgnore(filename)) return;

  log(`File change detected: ${filename} (${eventType})`);
  scheduleSync();
});

// Perform an initial sync check on start
syncToGitHub();
