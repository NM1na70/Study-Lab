// Import SQLite, filesystem helpers, and the shared progress contracts and rules
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Lesson, Mutation, Progress } from '../shared/schema.js';
import { migrateProgress } from '../shared/migrate.js';
import { Reviews } from './reviews.js';
import { lessons } from '../shared/lessons.js';
import { DomainError, emptyProgress, mutate } from '../shared/domain.js';

// Keep SQLite reads and transactional progress updates behind one storage boundary
export class Store {
  readonly db: DatabaseSync;
  readonly reviews: Reviews;

  // Open the database and refuse newer schemas instead of silently downgrading learner data
  constructor(path: string, clock: () => Date = () => new Date()) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    const version = this.db.prepare('PRAGMA user_version').get();
    if (Number(version?.user_version) > 5) {
      this.db.close();
      throw new Error(
        'Unsupported database version; restore a compatible app or migrate explicitly.',
      );
    }
    this.db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');

    // Retain earlier tables and add schema 5 news snapshots and versioned lab result records
    this.db.exec(
      'BEGIN IMMEDIATE; CREATE TABLE IF NOT EXISTS progress (lesson_id TEXT PRIMARY KEY, state TEXT NOT NULL); CREATE TABLE IF NOT EXISTS progress_migrations (lesson_id TEXT NOT NULL, from_version INTEGER NOT NULL, to_version INTEGER NOT NULL, state TEXT NOT NULL, PRIMARY KEY (lesson_id, from_version, to_version)); CREATE TABLE IF NOT EXISTS review_schedule (concept TEXT PRIMARY KEY,state TEXT NOT NULL); CREATE TABLE IF NOT EXISTS review_sessions (id TEXT PRIMARY KEY,state TEXT NOT NULL); CREATE TABLE IF NOT EXISTS review_results (session_id TEXT NOT NULL,concept TEXT NOT NULL,state TEXT NOT NULL,PRIMARY KEY(session_id,concept)); CREATE TABLE IF NOT EXISTS ai_requests (id TEXT PRIMARY KEY,context_hash TEXT NOT NULL,created_at TEXT NOT NULL,status TEXT NOT NULL,response TEXT); CREATE TABLE IF NOT EXISTS ai_assistance (request_id TEXT PRIMARY KEY,lesson_id TEXT NOT NULL,task_id TEXT NOT NULL); CREATE TABLE IF NOT EXISTS quiz_session (id INTEGER PRIMARY KEY,state TEXT NOT NULL); CREATE TABLE IF NOT EXISTS quiz_history (id TEXT PRIMARY KEY,state TEXT NOT NULL); CREATE TABLE IF NOT EXISTS lab_state (id INTEGER PRIMARY KEY,state TEXT NOT NULL); CREATE TABLE IF NOT EXISTS lab_history (id INTEGER PRIMARY KEY,state TEXT NOT NULL); CREATE TABLE IF NOT EXISTS lab_results (id TEXT PRIMARY KEY,state TEXT NOT NULL); CREATE TABLE IF NOT EXISTS news_snapshots (id TEXT PRIMARY KEY,state TEXT NOT NULL); PRAGMA user_version=5; COMMIT;',
    );
    this.reviews = new Reviews(this.db, lessons, clock);
  }

  // Read saved work or construct an unsaved starting state for a new lesson
  get(lesson: Lesson): Progress {
    const row = this.db
      .prepare('SELECT state FROM progress WHERE lesson_id = ?')
      .get(lesson.id);
    if (!row) return emptyProgress(lesson);
    const previous = JSON.parse(String(row.state)) as Progress;
    if (previous.contentVersion === lesson.version) return previous;

    // Archive and migrate atomically before exposing updated work to the learner
    const next = migrateProgress(lesson, previous);
    this.db.exec('SAVEPOINT content_migration');
    try {
      this.db
        .prepare(
          'INSERT OR IGNORE INTO progress_migrations VALUES (?, ?, ?, ?)',
        )
        .run(
          lesson.id,
          previous.contentVersion,
          lesson.version,
          String(row.state),
        );
      const updated = this.db
        .prepare(
          'UPDATE progress SET state = ? WHERE lesson_id = ? AND state = ?',
        )
        .run(JSON.stringify(next), lesson.id, String(row.state));
      this.db.exec('RELEASE content_migration');
      return updated.changes ? next : this.get(lesson);
    } catch (error) {
      this.db.exec('ROLLBACK TO content_migration; RELEASE content_migration');
      throw error;
    }
  }

  // Check the revision and write the result inside one SQLite transaction across processes
  update(
    lesson: Lesson,
    mutation: Mutation,
    labProof?: {
      assisted: boolean;
      id: string;
      state: string;
      verified: boolean;
    },
  ): Progress {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const task = lesson.tasks.find((task) => task.id === mutation.taskId);

      // Reject supplied lab answers unless owner-authorised server verification provided the live proof
      if (task?.labScenario && mutation.action === 'check' && !labProof)
        throw new DomainError(
          'Verify the live lab objectives using owner controls before checking this question',
        );
      let current = this.get(lesson);
      if (labProof) {
        if (current.revision !== mutation.revision)
          throw new DomainError(
            'Progress changed — reload before verifying the lab',
            409,
          );

        // Deduplicate an already recorded model revision before adding another assessed attempt
        if (
          this.db
            .prepare('SELECT id FROM lab_results WHERE id=?')
            .get(labProof.id)
        ) {
          this.db.exec('COMMIT');
          return current;
        }
        current = mutate(lesson, current, {
          action: 'draft',
          taskId: task!.id,
          answer: labProof.verified ? 'supported' : 'pending',
          revision: current.revision,
        });
        if (labProof.assisted)
          current = mutate(lesson, current, {
            action: 'solution',
            taskId: task!.id,
            revision: current.revision,
          });
        this.db.prepare('INSERT INTO lab_results VALUES (?,?)').run(
          labProof.id,
          JSON.stringify({
            scenario: 'defence-v1',
            lessonId: lesson.id,
            contentVersion: lesson.version,
            verified: labProof.verified,
            assisted: labProof.assisted,
            checkedAt: new Date().toISOString(),
            model: JSON.parse(labProof.state),
          }),
        );
      }
      const next = mutate(lesson, current, {
        ...mutation,
        revision: labProof ? current.revision : mutation.revision,
      });
      this.db
        .prepare(
          'INSERT INTO progress (lesson_id, state) VALUES (?, ?) ON CONFLICT(lesson_id) DO UPDATE SET state=excluded.state',
        )
        .run(lesson.id, JSON.stringify(next));
      this.reviews.lessonChanged(lesson, next, mutation);
      this.db.exec('COMMIT');
      return { ...next, reviewDueCount: this.reviews.snapshot().count };
    } catch (error) {
      // Roll back failed validation or writes so no partial progress can be committed
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  // Apply feedback assistance once under the same write lock as ordinary progress changes
  recordAiHelp(lesson: Lesson, taskId: string, requestId: string): Progress {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const inserted = this.db
        .prepare('INSERT OR IGNORE INTO ai_assistance VALUES (?,?,?)')
        .run(requestId, lesson.id, taskId);
      const current = this.get(lesson);
      if (inserted.changes) {
        current.tasks[taskId].aiHelp = (current.tasks[taskId].aiHelp ?? 0) + 1;
        current.revision++;
        current.updatedAt = new Date().toISOString();
        this.db
          .prepare('UPDATE progress SET state=? WHERE lesson_id=?')
          .run(JSON.stringify(current), lesson.id);
      }
      this.db.exec('COMMIT');
      return current;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  // Release the SQLite connection during server shutdown or test cleanup
  close() {
    this.db.close();
  }
}
