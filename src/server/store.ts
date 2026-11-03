import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Lesson, Mutation, Progress } from '../shared/schema.js';
import { emptyProgress, mutate } from '../shared/domain.js';
export class Store {
  readonly db: DatabaseSync;
  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    const version = this.db.prepare('PRAGMA user_version').get();
    if (Number(version?.user_version) > 1) {
      this.db.close();
      throw new Error(
        'Unsupported database version; restore a compatible app or migrate explicitly.',
      );
    }
    this.db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
    // Schema v1. Content versions live inside each record; never silently reset work.
    this.db.exec(
      'CREATE TABLE IF NOT EXISTS progress (lesson_id TEXT PRIMARY KEY, state TEXT NOT NULL); PRAGMA user_version=1;',
    );
  }
  get(lesson: Lesson): Progress {
    const row = this.db
      .prepare('SELECT state FROM progress WHERE lesson_id = ?')
      .get(lesson.id);
    return row
      ? (JSON.parse(String(row.state)) as Progress)
      : emptyProgress(lesson);
  }
  update(lesson: Lesson, mutation: Mutation): Progress {
    // Read/check/write share one SQLite write transaction, including across processes.
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const next = mutate(lesson, this.get(lesson), mutation);
      this.db
        .prepare(
          'INSERT INTO progress (lesson_id, state) VALUES (?, ?) ON CONFLICT(lesson_id) DO UPDATE SET state=excluded.state',
        )
        .run(lesson.id, JSON.stringify(next));
      this.db.exec('COMMIT');
      return next;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
  close() {
    this.db.close();
  }
}
