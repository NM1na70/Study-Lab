// Import the parsed lesson pack and strict assertions for content relationships
import assert from 'node:assert/strict';
import { lessons } from '../src/shared/lessons.js';

// Check unique lesson, task, and source IDs after the shared schema validates each lesson
const ids = new Set<string>();
for (const lesson of lessons) {
  assert(!ids.has(lesson.id), `Duplicate lesson ${lesson.id}`);
  ids.add(lesson.id);
  const tasks = new Set<string>();
  const sources = new Set(lesson.sources.map((s) => s.id));
  assert.equal(sources.size, lesson.sources.length, 'Duplicate source IDs');

  // Require usable hints and answers and ensure every task cites an existing source
  for (const task of lesson.tasks) {
    assert(!tasks.has(task.id), `Duplicate task ${task.id}`);
    tasks.add(task.id);
    assert(task.hints.length >= 2);
    assert(task.explanation.length > 20);
    if (task.kind === 'exact')
      assert(
        task.answers.includes(task.example),
        'Example must match answer key',
      );
    for (const id of task.sourceIds)
      assert(sources.has(id), `Unknown task source ${id}`);
  }

  // Validate teaching references and retain practice, independent work, and review in each lesson
  for (const section of lesson.teaching)
    for (const id of section.sourceIds)
      assert(sources.has(id), `Unknown section source ${id}`);
  for (const stage of ['practice', 'independent', 'review'])
    assert(
      lesson.tasks.some((t) => t.stage === stage),
      `Missing ${stage}`,
    );
}

// Enforce the agreed Milestone 1 pack size and minimum English practice coverage
assert.equal(lessons.length, 2, 'Milestone 1 contains two complete lessons');
assert(
  lessons
    .find((l) => l.course === 'English')!
    .tasks.filter((t) => t.stage === 'practice').length >= 6,
);
console.log(
  'Validated 2 lessons, task/source references, answers, hints and required stages.',
);
