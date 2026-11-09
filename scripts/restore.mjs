// Import SQLite verification and filesystem operations for the stopped-app restore command
import { DatabaseSync } from 'node:sqlite';
import {
  copyFileSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';

// Choose the existing learner database and a temporary file for the incoming backup
const target = process.env.DATABASE_PATH ?? 'data/study.sqlite';
const input = '/tmp/study-restore.sqlite';

// Read backup bytes from standard input after the caller has stopped the app
// This is a CLI operation with no website route
writeFileSync(input, readFileSync(0));

// Verify database integrity, schema version, and the progress table before replacing any work
const db = new DatabaseSync(input, { readOnly: true });
try {
  if (db.prepare('PRAGMA integrity_check').get().integrity_check !== 'ok')
    throw new Error('Backup failed integrity check.');
  if (
    ![1, 2, 3, 4, 5].includes(
      db.prepare('PRAGMA user_version').get().user_version,
    )
  )
    throw new Error('Unsupported backup schema.');
  db.prepare('SELECT lesson_id, state FROM progress LIMIT 1').get();
} finally {
  db.close();
}

// Stage on the destination filesystem and remove stale SQLite sidecars before the final rename
copyFileSync(input, target + '.restore');
for (const suffix of ['-wal', '-shm']) rmSync(target + suffix, { force: true });
renameSync(target + '.restore', target);
rmSync(input);
console.log(
  'Restored verified SQLite backup. Start the app and check your lessons.',
);
