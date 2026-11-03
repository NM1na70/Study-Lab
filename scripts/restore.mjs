import { DatabaseSync } from 'node:sqlite';
import {
  copyFileSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
const target = process.env.DATABASE_PATH ?? 'data/study.sqlite';
const input = '/tmp/study-restore.sqlite';
// CLI only. The caller MUST stop the app first; no website route can invoke this.
writeFileSync(input, readFileSync(0));
const db = new DatabaseSync(input, { readOnly: true });
try {
  if (db.prepare('PRAGMA integrity_check').get().integrity_check !== 'ok')
    throw new Error('Backup failed integrity check.');
  if (db.prepare('PRAGMA user_version').get().user_version !== 1)
    throw new Error('Unsupported backup schema.');
  db.prepare('SELECT lesson_id, state FROM progress LIMIT 1').get();
} finally {
  db.close();
}
// Stage on the destination filesystem before replacing current progress.
copyFileSync(input, target + '.restore');
for (const suffix of ['-wal', '-shm']) rmSync(target + suffix, { force: true });
renameSync(target + '.restore', target);
rmSync(input);
console.log(
  'Restored verified SQLite backup. Start the app and check your lessons.',
);
