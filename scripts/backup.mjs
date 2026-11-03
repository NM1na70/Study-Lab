// Import SQLite backup support and path comparison without adding an HTTP entry point
import { DatabaseSync, backup } from 'node:sqlite';
import { resolve } from 'node:path';

// Require a separate destination so a backup cannot overwrite the open source database
if (!process.argv[2])
  throw new Error('Specify a destination outside the data directory.');
const source = process.env.DATABASE_PATH ?? 'data/study.sqlite';
if (resolve(source) === resolve(process.argv[2]))
  throw new Error('Backup must differ from source.');

// Use SQLite's backup API to include committed WAL state and always release the connection
const db = new DatabaseSync(source, { readOnly: true });
try {
  await backup(db, process.argv[2]);
  console.log('Consistent SQLite backup created.');
} finally {
  db.close();
}
