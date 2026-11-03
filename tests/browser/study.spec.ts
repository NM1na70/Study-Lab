// Import the isolated browser fixture, accessibility checks, and real lesson content
import { test, expect } from './fixtures';
import AxeBuilder from '@axe-core/playwright';
import { lessons } from '../../src/shared/lessons.js';

// Exercise both real lessons while blocking external services and checking saved work across browser contexts
test('external-network-free study, resume, mistakes and complete both lessons', async ({
  page,
  context,
  browser,
  baseURL,
}) => {
  const external: string[] = [];
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.hostname !== '127.0.0.1') {
      external.push(url.href);
      return route.abort();
    }
    return route.continue();
  });

  // Check keyboard access and dashboard accessibility before starting the lesson flows
  await page.goto('/');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await expect(
    page.getByRole('heading', { name: 'Your courses' }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: 'test-results/dashboard-' + test.info().project.name + '.png',
    fullPage: true,
  });

  // Make and correct a mistake, resume saved work, and satisfy every required activity in each course
  for (const lesson of lessons) {
    await page.goto(`/#/lesson/${lesson.id}`);
    await expect(
      page.getByRole('heading', { name: lesson.title, exact: true }),
    ).toBeVisible();
    await page.getByLabel('Go to activity').selectOption('1');
    await expect(
      page.getByRole('heading', { name: lesson.tasks[0].prompt, exact: true }),
    ).toBeVisible();
    await page.getByLabel('Your answer').fill('deliberately wrong');
    await page.getByRole('button', { name: 'Check answer' }).click();
    await expect(page.getByText('Not correct yet. Try again.')).toBeVisible();
    await page.getByRole('button', { name: /Next hint/ }).click();
    await expect(page.getByText('Hint 1:', { exact: true })).toBeVisible();
    await page.getByLabel('Your answer').fill(lesson.tasks[0].example);
    await expect(page.getByText(/^Answer saved ·/)).toBeVisible();
    await page.reload();
    await expect(page.getByLabel('Your answer')).toHaveValue(
      lesson.tasks[0].example,
    );
    for (const [index, task] of lesson.tasks.entries()) {
      await page.getByLabel('Go to activity').selectOption(String(index + 1));
      await expect(
        page.getByRole('heading', { name: task.prompt, exact: true }),
      ).toBeVisible();
      await page.getByLabel('Your answer').fill(task.example);
      if (task.kind === 'written') {
        await page
          .getByRole('button', { name: 'Reveal example answer' })
          .click();
        await expect(
          page.getByRole('heading', { name: 'Example answer', exact: true }),
        ).toBeVisible();
        await page.getByRole('checkbox').check();
        await page.getByRole('button', { name: 'Record self-review' }).click();
        await expect(page.getByText(/Self-review recorded/)).toBeVisible();
      } else {
        await page.getByRole('button', { name: 'Check answer' }).click();
        await expect(page.getByText('Correct.', { exact: true })).toBeVisible();
      }
    }
    await page.getByRole('button', { name: 'Mark lesson complete' }).click();
    await expect(
      page.getByRole('button', { name: 'Lesson completed' }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole('button', { name: 'Lesson completed' }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }

  // Retry a recorded mistake and confirm completion remains visible in a fresh browser context
  await page.getByRole('link', { name: 'Mistake review' }).click();
  await expect(
    page.getByRole('heading', { name: 'Mistake review', exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Your answer').first()).toBeVisible();
  await page.getByLabel('Your answer').first().fill('action');
  await page.getByRole('button', { name: 'Check answer' }).first().click();
  await expect(
    page.getByText('Correct.', { exact: true }).first(),
  ).toBeVisible();
  expect(external).toEqual([]);
  const reopened = await browser.newContext();
  const newPage = await reopened.newPage();
  await newPage.goto(baseURL! + '/');
  await expect(newPage.locator('.stats strong')).toHaveText('2/ 2');
  await reopened.close();
});

// Preserve the newest draft during navigation and keep text available after an API save failure
test('quick edits flush on navigation and save errors retain text for retry', async ({
  page,
}) => {
  await page.goto('/#/lesson/' + lessons[0].id);
  await page.getByLabel('Go to activity').selectOption('2');
  await expect(
    page.getByRole('heading', {
      name: lessons[0].tasks[1].prompt,
      exact: true,
    }),
  ).toBeVisible();
  await page.getByLabel('Your answer').fill('quick first');
  await page.getByLabel('Your answer').fill('connection');
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Your courses' }),
  ).toBeVisible();
  await page.goto('/#/lesson/' + lessons[0].id);
  await expect(page.getByLabel('Your answer')).toHaveValue('connection');

  // Fail only progress writes, then restore the route to test an explicit recovery
  await page.route('**/api/progress/**', (r) =>
    r.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Temporary test save failure' }),
    }),
  );
  await page.getByLabel('Your answer').fill('retained draft');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByText('Save error', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Your answer')).toHaveValue('retained draft');
  await page.unroute('**/api/progress/**');
  await page.getByRole('button', { name: 'Enable retry' }).click();
  await page.getByLabel('Your answer').fill('connection');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByText('Correct.', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Your answer')).toHaveValue('connection');
});
