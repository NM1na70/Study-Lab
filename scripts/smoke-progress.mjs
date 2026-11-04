// Import strict assertions for checking the isolated smoke server through HTTP
import assert from 'node:assert/strict';

// Use the isolated smoke server URL and select whether to populate or verify its learner state
const [base, mode] = process.argv.slice(2);

// Fail on HTTP errors before reading the server's lessons and persisted progress
async function snapshot() {
  const r = await fetch(base + '/api/lessons');
  assert(r.ok);
  return r.json();
}

// Build the content-defined example using stable option and report field identities
function example(task) {
  if (task.kind === 'report')
    return Object.fromEntries(
      task.fields.map((field) => [field.id, field.example]),
    );
  if (task.kind === 'multiple') return task.answers;
  if (['choice', 'select'].includes(task.kind)) return task.answers[0];
  return task.example;
}

// Complete every activity through the real API and record position and assistance for persistence checks
if (mode === 'write') {
  const { lessons, progress } = await snapshot();
  for (const lesson of lessons) {
    let state = progress.find((p) => p.lessonId === lesson.id);

    // Carry each confirmed revision into the next write so the smoke flow follows normal concurrency rules
    async function update(mutation) {
      const r = await fetch(base + '/api/progress/' + lesson.id, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...mutation, revision: state.revision }),
      });
      assert(r.ok, await r.clone().text());
      state = await r.json();
    }
    for (const task of lesson.tasks) {
      await update({ action: 'draft', taskId: task.id, answer: example(task) });
      await update({
        action: task.kind === 'written' ? 'selfReview' : 'check',
        taskId: task.id,
      });
      if (task.kind === 'report')
        await update({ action: 'selfReview', taskId: task.id });
    }
    await update({ action: 'hint', taskId: lesson.tasks[0].id });
    await update({ action: 'solution', taskId: lesson.tasks[0].id });
    await update({ action: 'step', step: 3 });
    await update({ action: 'complete' });
  }
} else if (mode === 'read') {
  // Recheck answers, completion, position, content versions, and assistance after recreation or restore
  const { lessons, progress } = await snapshot();
  for (const lesson of lessons) {
    const p = progress.find((p) => p.lessonId === lesson.id);
    assert(p.completedAt);
    assert.equal(p.step, 3);
    assert.equal(p.contentVersion, lesson.version);
    assert.equal(p.tasks[lesson.tasks[0].id].hints, 1);
    assert(p.tasks[lesson.tasks[0].id].solution);
    for (const task of lesson.tasks) {
      assert.deepEqual(p.tasks[task.id].answer, example(task));
      assert(
        ['written', 'report'].includes(task.kind)
          ? p.tasks[task.id].reviewed
          : p.tasks[task.id].correct,
      );
    }
  }
} else throw new Error('Expected write or read');
console.log('Docker progress ' + mode + ' verified');
