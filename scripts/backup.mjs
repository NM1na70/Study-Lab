import { DatabaseSync, backup } from 'node:sqlite';
import { resolve } from 'node:path';
if (!process.argv[2])
  throw new Error('Specify a destination outside the data directory.');
const source = process.env.DATABASE_PATH ?? 'data/study.sqlite';
if (resolve(source) === resolve(process.argv[2]))
  throw new Error('Backup must differ from source.');
const db = new DatabaseSync(source, { readOnly: true });
try {
  await backup(db, process.argv[2]);
  console.log('Consistent SQLite backup created.');
} finally {
  db.close();
}
