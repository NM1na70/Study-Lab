// Import real content and assessment rules for complete offline lesson checks
import { it, expect } from 'vitest';
import { lessons } from '../src/shared/lessons.js';
import {
  emptyProgress,
  exampleAnswer,
  mutate,
  satisfied,
} from '../src/shared/domain.js';

// Complete every declared activity through the same domain rules used by HTTP writes
it('can complete every published lesson without AI or hidden grading exceptions', () => {
  // Exercise domain eligibility only; owner-authorised lab proof is tested separately at the API boundary
  for (const lesson of lessons) {
    let progress = emptyProgress(lesson);
    for (const task of lesson.tasks) {
      progress = mutate(lesson, progress, {
        action: 'draft',
        taskId: task.id,
        answer: exampleAnswer(task),
        revision: progress.revision,
      });
      if (task.kind !== 'written')
        progress = mutate(lesson, progress, {
          action: 'check',
          taskId: task.id,
          revision: progress.revision,
        });
      if (['written', 'report'].includes(task.kind))
        progress = mutate(lesson, progress, {
          action: 'selfReview',
          taskId: task.id,
          revision: progress.revision,
        });
    }
    expect(satisfied(lesson, progress), lesson.id).toBe(lesson.tasks.length);
    progress = mutate(lesson, progress, {
      action: 'complete',
      revision: progress.revision,
    });
    expect(progress.completedAt).toBeTruthy();
  }
});

// Preserve complete checkpoint answers and assistance while requiring every newly added assessment
it('migrates each changed checkpoint lesson without transferring completion to new requirements', async () => {
  const { Store } = await import('../src/server/store.js');
  const store = new Store(':memory:');
  try {
    for (const lesson of lessons.filter((lesson) => lesson.previousVersion)) {
      const prior = {
        ...lesson,
        version: lesson.previousVersion!,
        previousVersion: undefined,
        tasks: lesson.tasks.filter(
          (task) =>
            !task.passage &&
            (!task.tier || task.tier === 'University Intermediate'),
        ),
      };
      let saved = emptyProgress(prior);
      for (const task of prior.tasks) {
        saved = mutate(prior, saved, {
          action: 'draft',
          taskId: task.id,
          answer: exampleAnswer(task),
          revision: saved.revision,
        });
        if (task.kind !== 'written')
          saved = mutate(prior, saved, {
            action: 'check',
            taskId: task.id,
            revision: saved.revision,
          });
        if (['written', 'report'].includes(task.kind))
          saved = mutate(prior, saved, {
            action: 'selfReview',
            taskId: task.id,
            revision: saved.revision,
          });
      }
      saved = mutate(prior, saved, {
        action: 'complete',
        revision: saved.revision,
      });
      saved.tasks[prior.tasks[0].id].hints = 1;
      saved.tasks[prior.tasks[0].id].reviewDismissedMistakes = 2;
      store.db
        .prepare('INSERT INTO progress VALUES (?,?)')
        .run(lesson.id, JSON.stringify(saved));
      const migrated = store.get(lesson);
      for (const task of prior.tasks)
        expect(migrated.tasks[task.id]).toEqual(saved.tasks[task.id]);
      expect(migrated.completedAt).toBeNull();
      expect(migrated.completionHistory).toContainEqual({
        contentVersion: prior.version,
        completedAt: saved.completedAt,
        assisted: true,
      });
      for (const task of lesson.tasks.filter(
        (task) => !prior.tasks.some((old) => old.id === task.id),
      ))
        expect(migrated.tasks[task.id].correct).toBe(false);
      expect(
        JSON.parse(
          String(
            store.db
              .prepare(
                'SELECT state FROM progress_migrations WHERE lesson_id=?',
              )
              .get(lesson.id)?.state,
          ),
        ),
      ).toEqual(saved);
    }
  } finally {
    store.close();
  }
});
