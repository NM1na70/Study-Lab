// Exercise shared answers and accessible confirmation against disposable browser data
import { test, expect } from './fixtures';
import AxeBuilder from '@axe-core/playwright';
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
  await expect(
    page.locator('main').getByRole('link', {
      name: /^(Open Lesson|Mistake Review|Course Catalogue)$/,
    }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Don’t Refresh' }).click();
  expect((await (await page.request.get('/api/quiz')).json()).id).toBe(
    session.id,
  );

  // Follow the retained main navigation and dashboard card to verify that the shared lesson draft still saves
  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Dashboard', exact: true })
    .click();
  await page
    .locator(`.course-card a[href="#/lesson/${first.lessonId}"]`)
    .click();
  await expect(
    page.getByRole('navigation', { name: 'Lesson Route' }),
  ).toBeVisible();
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

// Course tabs retain independent positions and flush shared drafts without regenerating the persistent selection
test('course tabs keep independent questions and support keyboard navigation with shared saved drafts', async ({
  page,
}) => {
  await page.goto('/#/quiz');
  const english = page.getByRole('tab', {
    name: 'English — 7 Questions',
    exact: true,
  });
  const cyber = page.getByRole('tab', {
    name: 'Cybersecurity — 7 Questions',
    exact: true,
  });
  await expect(english).toHaveAttribute('aria-selected', 'true');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const original = await (await page.request.get('/api/quiz')).json();
  await page.getByLabel('Your answer').fill('English first draft');
  await page
    .getByRole('navigation', { name: 'Quiz Questions' })
    .getByRole('button')
    .nth(1)
    .click();
  await page.getByLabel('Your answer').fill('English second draft');
  await cyber.click();
  await page.getByLabel('Your answer').fill('Cybersecurity draft');
  await cyber.press('Home');
  await expect(english).toBeFocused();
  await expect(page.getByLabel('Your answer')).toHaveValue(
    'English second draft',
  );
  await page
    .getByRole('navigation', { name: 'Quiz Questions' })
    .getByRole('button')
    .first()
    .click();
  await expect(page.getByLabel('Your answer')).toHaveValue(
    'English first draft',
  );
  await english.press('End');
  await expect(cyber).toBeFocused();
  await expect(page.getByLabel('Your answer')).toHaveValue(
    'Cybersecurity draft',
  );
  const after = await (await page.request.get('/api/quiz')).json();
  expect(after).toEqual(original);
  const snapshot = await (await page.request.get('/api/lessons')).json();
  const first = original.items[0];
  expect(
    snapshot.progress.find(
      (saved: { lessonId: string }) => saved.lessonId === first.lessonId,
    ).tasks[first.taskId].answer,
  ).toBe('English first draft');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

// A failed tab flush must keep the current course and draft, and explicit retry must still save through the normal queue
test('failed course switching keeps its draft and does not refresh either course', async ({
  page,
}) => {
  await page.goto('/#/quiz');
  await page.getByLabel('Your answer').waitFor();
  const original = await (await page.request.get('/api/quiz')).json();
  await page.route('**/api/progress/**', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Simulated tab save failure' }),
    }),
  );
  await page.getByLabel('Your answer').fill('Keep this tab draft');
  await page.getByRole('tab', { name: /^Cybersecurity/ }).click();
  await expect(page.getByRole('tab', { name: /^English/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByLabel('Your answer')).toHaveValue(
    'Keep this tab draft',
  );
  expect(await (await page.request.get('/api/quiz')).json()).toEqual(original);
  await page.unroute('**/api/progress/**');
  await page.getByRole('button', { name: 'Enable Retry' }).click();
  await page.getByRole('tab', { name: /^Cybersecurity/ }).click();
  await expect(
    page.getByRole('tab', { name: /^Cybersecurity/ }),
  ).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: /^English/ }).click();
  await expect(page.getByLabel('Your answer')).toHaveValue(
    'Keep this tab draft',
  );
});

// Display an older mixed selection as-is, with honest per-course counts, until the owner explicitly refreshes both courses
test('legacy mixed selection is grouped without adding questions until explicit Refresh', async ({
  page,
}) => {
  const current = await (await page.request.get('/api/quiz')).json();
  const legacy = {
    ...current,
    policy: undefined,
    items: [...current.items.slice(0, 3), ...current.items.slice(7, 9)],
  };
  await page.route('**/api/quiz', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(legacy),
    }),
  );
  await page.goto('/#/quiz');
  await expect(
    page.getByRole('tab', { name: 'English — 3 Questions', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('tab', { name: 'Cybersecurity — 2 Questions', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/Existing selection grouped by course/),
  ).toBeVisible();
  await page.getByRole('tab', { name: /^Cybersecurity/ }).click();
  expect((await (await page.request.get('/api/quiz')).json()).id).toBe(
    current.id,
  );
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('English');
  await expect(page.getByRole('dialog')).toContainText('Cybersecurity');
  await page.getByRole('button', { name: 'Still Refresh' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(
    page.getByRole('tab', { name: 'English — 7 Questions', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('tab', { name: 'Cybersecurity — 7 Questions', exact: true }),
  ).toBeVisible();
});
