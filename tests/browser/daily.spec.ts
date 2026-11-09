// Exercise shared answers and accessible confirmation against disposable browser data
import { test, expect } from './fixtures';
test('Daily Quiz shares drafts with lessons and refresh preserves unfinished work', async ({
  page,
}) => {
  await page.goto('/#/quiz');
  await expect(
    page.getByRole('heading', { name: 'Daily Quiz', exact: true }),
  ).toBeVisible();
  const session = await (await page.request.get('/api/quiz')).json();
  const first = session.items[0];
  await page.getByLabel('Your answer').fill('unfinished spelling');
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Don’t Refresh' }).click();
  expect((await (await page.request.get('/api/quiz')).json()).id).toBe(
    session.id,
  );
  await page.getByRole('link', { name: 'Open Lesson', exact: true }).click();
  const snapshot = await (await page.request.get('/api/lessons')).json();
  expect(
    snapshot.progress.find(
      (p: { lessonId: string }) => p.lessonId === first.lessonId,
    ).tasks[first.taskId].answer,
  ).toBe('unfinished spelling');
  await page.getByRole('link', { name: 'Daily Quiz', exact: true }).click();
  await expect(page.getByLabel('Your answer')).toHaveValue(
    'unfinished spelling',
  );
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await page.getByRole('button', { name: 'Still Refresh' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect((await (await page.request.get('/api/quiz')).json()).id).not.toBe(
    session.id,
  );
});

test('navigation order and legacy review link retain both stacked review sections', async ({
  page,
}) => {
  await page.goto('/#/due');
  await expect(page).toHaveURL(/#\/review$/);
  await expect(
    page.getByRole('navigation', { name: 'Main' }).getByRole('link'),
  ).toHaveText(['Dashboard', 'Daily Quiz', 'Mistake Review', 'AI Settings']);
  await expect(
    page.getByRole('region', { name: 'Scheduled Review' }),
  ).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Recorded Mistakes' }),
  ).toBeVisible();
});

// A failed draft save must keep both the original selection and the visible unfinished answer
test('quiz refresh does not replace the session when its draft cannot save', async ({
  page,
}) => {
  await page.goto('/#/quiz');
  await page.getByLabel('Your answer').waitFor();
  const original = await (await page.request.get('/api/quiz')).json();
  await page.route('**/api/progress/**', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Simulated save failure' }),
    }),
  );
  await page.getByLabel('Your answer').fill('draft retained after failure');
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await page.getByRole('button', { name: 'Still Refresh' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText(
    'Save did not succeed',
  );
  expect((await (await page.request.get('/api/quiz')).json()).id).toBe(
    original.id,
  );
  await page.getByRole('button', { name: 'Don’t Refresh' }).click();
  await expect(page.getByLabel('Your answer')).toHaveValue(
    'draft retained after failure',
  );
});
