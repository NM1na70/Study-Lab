// Import the parsed lesson pack and strict assertions for content relationships
import assert from 'node:assert/strict';
import { exampleAnswer, fieldCorrect, mark } from '../src/shared/domain.js';
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
    const options = new Set(task.options.map((option) => option.id));
    assert.equal(options.size, task.options.length, 'Duplicate option IDs');
    if (['choice', 'select', 'multiple'].includes(task.kind)) {
      assert(options.size >= 2);
      assert(
        task.answers.every((answer) => options.has(answer)),
        'Answer must reference a stable option ID',
      );
    }
    assert.equal(
      new Set(task.fields.map((field) => field.id)).size,
      task.fields.length,
      'Duplicate report field IDs',
    );
    if (task.kind === 'report')
      for (const field of task.fields) {
        assert.equal(
          new Set(field.options.map((option) => option.id)).size,
          field.options.length,
        );
        if (field.kind !== 'reasoning')
          assert(
            fieldCorrect(field, field.example),
            'Report example must match the factual key',
          );
        else
          assert.equal(
            field.answers.length,
            0,
            'Reasoning must not imply deterministic marking',
          );
        if (field.kind === 'select')
          assert(
            field.answers.every((answer) =>
              field.options.some((option) => option.id === answer),
            ),
          );
      }
    for (const mapping of task.findingMappings) {
      assert(lesson.tasks.some((source) => source.id === mapping.taskId));
      assert(task.fields.some((field) => field.id === mapping.fieldId));
    }
    for (const rule of task.reportRules) {
      assert(
        task.fields
          .find((field) => field.id === 'assessment')
          ?.options.some((option) => option.id === rule.assessmentId),
      );
      assert(
        rule.evidenceIds.every((id) =>
          task.fields
            .find((field) => field.id === 'evidence')
            ?.answers.includes(id),
        ),
      );
      assert(
        rule.frameIds.every((id) =>
          task.fields
            .find((field) => field.id === 'frames')
            ?.answers.includes(id),
        ),
      );
    }
    if (task.kind !== 'written')
      assert(
        mark(task, exampleAnswer(task)),
        'Example must satisfy the deterministic check',
      );
    assert(
      task.emphasis.every((token) => task.explanation.includes(token)),
      'Emphasis must reference literal explanation text',
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

// Enforce the twenty-lesson catalogue and minimum foundational English practice coverage
assert.equal(
  lessons.length,
  20,
  'Final catalogue contains ten complete lessons per course',
);
assert(
  lessons
    .find((l) => l.course === 'English')!
    .tasks.filter((t) => t.stage === 'practice').length >= 6,
);
console.log(
  `Validated ${lessons.length} complete lessons, task/source references, answers, hints and required stages`,
);

// Require a coherent published order and resolve every reusable report field reference
for (const course of ['English', 'Cybersecurity']) {
  const entries = lessons.filter((lesson) => lesson.course === course);
  assert.equal(entries.length, 10);
  assert.deepEqual(
    entries.map((lesson) => lesson.order).sort((a, b) => a - b),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  );
}
const concepts = new Set<string>();
for (const lesson of lessons)
  for (const task of lesson.tasks) {
    if (task.reviewConcept) {
      assert(!concepts.has(task.reviewConcept), 'Duplicate review concept');
      concepts.add(task.reviewConcept);
      assert(!['written', 'report'].includes(task.kind));
    }
    for (const section of task.reportLayout)
      for (const sentence of section.sentences)
        for (const match of sentence.matchAll(/\{([a-z0-9-]+)\}/g))
          assert(
            task.fields.some((field) => field.id === match[1]),
            'Unknown report layout field',
          );
  }
