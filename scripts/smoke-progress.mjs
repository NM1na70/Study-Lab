// Import strict assertions for checking the isolated smoke server through HTTP
import assert from 'node:assert/strict';

// Use the isolated smoke server URL and select whether to populate or verify its learner state
const [base, mode] = process.argv.slice(2);
assert(['write', 'read'].includes(mode), 'Expected write or read');

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

// Assert the shipped Docker boundary explicitly, without creating or forwarding owner credentials
const statusResponse = await fetch(base + '/api/ai/status');
assert.equal(statusResponse.status, 200);
assert.equal(
  (await statusResponse.json()).available,
  false,
  'Docker smoke requires the shipped owner-disabled configuration',
);
for (const [path, body] of [
  ['/api/lab', undefined],
  ['/api/lab/history', undefined],
  ['/api/lab', { revision: 0, action: 'start' }],
]) {
  const response = await fetch(
    base + path,
    body === undefined
      ? undefined
      : {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
  );
  assert.equal(
    response.status,
    403,
    'Owner model access must remain unavailable',
  );
}

// Exercise ordinary assessment fully and prove that unavailable model verification cannot grant completion
if (mode === 'write') {
  const { lessons, progress } = await snapshot();
  for (const lesson of lessons) {
    let state = progress.find((p) => p.lessonId === lesson.id);

    // Carry confirmed revisions forward and verify rejected mutations leave the entire lesson unchanged
    async function update(mutation, expectedStatus = 200) {
      const r = await fetch(base + '/api/progress/' + lesson.id, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...mutation, revision: state.revision }),
      });
      assert.equal(r.status, expectedStatus, await r.clone().text());
      if (expectedStatus === 200) {
        state = await r.json();

        // Compare persisted progress without the response-only recall badge count
        delete state.reviewDueCount;
      } else {
        const current = await snapshot();
        assert.deepEqual(
          current.progress.find((p) => p.lessonId === lesson.id),
          state,
        );
      }
    }
    for (const task of lesson.tasks) {
      await update({ action: 'draft', taskId: task.id, answer: example(task) });
      if (task.labScenario) {
        // A correct-looking saved answer is not proof; both ordinary checks and ownerless verification must fail
        await update({ action: 'check', taskId: task.id }, 400);
        const verification = await fetch(base + '/api/lab/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ revision: state.revision }),
        });
        assert.equal(verification.status, 403);
        const current = await snapshot();
        assert.deepEqual(
          current.progress.find((p) => p.lessonId === lesson.id),
          state,
        );
      } else {
        await update({
          action: task.kind === 'written' ? 'selfReview' : 'check',
          taskId: task.id,
        });
        if (task.kind === 'report')
          await update({ action: 'selfReview', taskId: task.id });
      }
    }
    await update({ action: 'hint', taskId: lesson.tasks[0].id });
    await update({ action: 'solution', taskId: lesson.tasks[0].id });
    await update({ action: 'step', step: 3 });
    await update(
      { action: 'complete' },
      lesson.tasks.some((task) => task.labScenario) ? 400 : 200,
    );
  }
}

// Recheck every supported answer and the explicit incomplete lab boundary after writes, recreation or restore
const { lessons, progress } = await snapshot();
const labTasks = lessons.flatMap((lesson) =>
  lesson.tasks.filter((task) => task.labScenario),
);
assert(
  labTasks.length > 0,
  'Expected the integrated lab boundary to be exercised',
);
for (const lesson of lessons) {
  const p = progress.find((p) => p.lessonId === lesson.id);
  if (lesson.tasks.some((task) => task.labScenario))
    assert.equal(p.completedAt, null);
  else assert(p.completedAt);
  assert.equal(p.step, 3);
  assert.equal(p.contentVersion, lesson.version);
  assert.equal(p.tasks[lesson.tasks[0].id].hints, 1);
  assert(p.tasks[lesson.tasks[0].id].solution);
  for (const task of lesson.tasks) {
    const state = p.tasks[task.id];
    assert.deepEqual(state.answer, example(task));
    if (task.labScenario) {
      assert.equal(
        state.correct,
        false,
        'A forged lab answer must not earn a tick',
      );
      assert.equal(state.reviewed, false);
      assert.equal(state.checked, false);
      assert.equal(
        state.attempts,
        0,
        'Rejected requests must not create lab checks',
      );
    } else {
      assert(
        ['written', 'report'].includes(task.kind)
          ? state.reviewed
          : state.correct,
      );
    }
  }
}
console.log(
  `Supported progress ${mode} verified: ${progress.filter((p) => p.completedAt).length}/${lessons.length} lessons complete; owner-only lab questions remain incomplete: ${labTasks.map((task) => task.id).join(', ')}`,
);
