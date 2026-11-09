// Import the isolated browser fixture, accessibility checks, and real lesson content
import { test, expect } from './fixtures';
import AxeBuilder from '@axe-core/playwright';
import { exampleAnswer } from '../../src/shared/domain.js';
import { answerTask } from './answers';
import { lessons } from '../../src/shared/lessons.js';

// Exercise both real lessons while blocking external services and checking saved work across browser contexts
test('external-network-free original lessons, resume, mistakes and completion', async ({
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
  for (const lesson of lessons.slice(0, 2)) {
    await page.goto(`/#/lesson/${lesson.id}`);
    await expect(
      page.getByRole('heading', { name: lesson.title, exact: true }),
    ).toBeVisible();
    await page
      .getByRole('navigation', { name: 'Lesson Route' })
      .getByRole('button', { name: /^1\. / })
      .click();
    await expect(
      page.getByRole('heading', { name: lesson.tasks[0].prompt, exact: true }),
    ).toBeVisible();
    await page.locator('.study-map').screenshot({
      path:
        'test-results/route-' +
        lesson.course.toLowerCase() +
        '-' +
        test.info().project.name +
        '.png',
    });
    await page.getByLabel('Your answer').fill('deliberately wrong');
    await page.getByRole('button', { name: 'Check Answer' }).click();
    await expect(page.getByText('Not Correct Yet — Try Again')).toBeVisible();
    await page.getByRole('button', { name: /Next Hint/ }).click();
    await expect(page.getByText('Hint 1:', { exact: true })).toBeVisible();
    await page.getByLabel('Your answer').fill(lesson.tasks[0].example);
    await expect(page.getByText(/^Answer saved ·/)).toBeVisible();
    await page.reload();
    await expect(page.getByLabel('Your answer')).toHaveValue(
      lesson.tasks[0].example,
    );
    for (const [index, task] of lesson.tasks.entries()) {
      await page
        .getByRole('navigation', { name: 'Lesson Route' })
        .getByRole('button', { name: new RegExp('^' + (index + 1) + '\\. ') })
        .click();
      await expect(
        page.getByRole('heading', { name: task.prompt, exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: /Save And Next Activity/ }),
      ).toHaveCount(index < lesson.tasks.length - 1 ? 1 : 0);
      await answerTask(page, task);
      if (task.kind === 'report') {
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual(
          [],
        );
        await page.screenshot({
          path: 'test-results/report-' + test.info().project.name + '.png',
          fullPage: true,
        });
        await page.getByRole('button', { name: 'Preview Report' }).click();
        await expect(
          page.getByRole('heading', { name: 'Your Report Preview' }),
        ).toBeFocused();
        await page.locator('.learner-report-preview').screenshot({
          path:
            'test-results/learner-preview-' + test.info().project.name + '.png',
        });
        await page.getByRole('button', { name: 'Return To Editing' }).click();
      }
      if (task.kind === 'written') {
        await page
          .getByRole('button', { name: 'Reveal Example Answer' })
          .click();
        await expect(
          page.getByRole('heading', { name: 'Example Answer', exact: true }),
        ).toBeVisible();
        await page.getByRole('checkbox').check();
        await page.getByRole('button', { name: 'Record Self-Review' }).click();
        await expect(page.getByText(/Self-review recorded/)).toBeVisible();
      } else {
        await page
          .getByRole('button', {
            name: task.kind === 'report' ? 'Check Report' : 'Check Answer',
          })
          .click();
        await expect(
          page.getByText(
            task.kind === 'report' ? 'Objective Report Checks Met' : 'Correct',
            { exact: true },
          ),
        ).toBeVisible();
        if (task.kind === 'report') {
          await page.getByLabel(/I compared my response/).check();
          await page
            .getByRole('button', { name: 'Record Self-Review' })
            .click();
          await expect(page.getByText(/Self-review recorded/)).toBeVisible();
        }
      }
    }
    if (lesson.course === 'Cybersecurity') {
      await page.getByRole('button', { name: 'Back To Dashboard' }).click();
      await page.getByRole('button', { name: 'Mark It As Completed' }).click();
      await expect(
        page.getByRole('heading', { name: 'Your courses' }),
      ).toBeVisible();
      await page.goto('/#/lesson/' + lesson.id);
    } else
      await page.getByRole('button', { name: 'Mark Lesson Complete' }).click();
    await expect(
      page.getByRole('button', { name: 'Lesson Completed' }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole('button', { name: 'Lesson Completed' }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }

  // Retry a recorded mistake and confirm completion remains visible in a fresh browser context
  await page.getByRole('link', { name: 'Mistake Review' }).click();
  await expect(
    page.getByRole('heading', { name: 'Mistake Review', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Review', exact: true })
    .first()
    .click();
  await expect(page.getByLabel('Your answer').first()).toBeVisible();
  await page.getByLabel('Your answer').first().fill('action');
  await page.getByRole('button', { name: 'Check Answer' }).first().click();
  await expect(
    page.getByText('Correct', { exact: true }).first(),
  ).toBeVisible();
  expect(external).toEqual([]);
  const reopened = await browser.newContext();
  const newPage = await reopened.newPage();
  await newPage.goto(baseURL! + '/');
  await expect(newPage.locator('.stats strong')).toHaveText(
    `2/ ${lessons.length}`,
  );
  await reopened.close();
});

// Preserve the newest draft during navigation and keep text available after an API save failure
test('quick edits flush on navigation and save errors retain text for retry', async ({
  page,
}) => {
  await page.goto('/#/lesson/' + lessons[0].id);
  await page
    .getByRole('navigation', { name: 'Lesson Route' })
    .getByRole('button', { name: /^2\. / })
    .click();
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
  await page.getByRole('button', { name: 'Check Answer' }).click();
  await expect(page.getByText('Save error', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Your answer')).toHaveValue('retained draft');
  await page.unroute('**/api/progress/**');
  await page.getByRole('button', { name: 'Enable Retry' }).click();
  await page.getByLabel('Your answer').fill('connection');
  await page.getByRole('button', { name: 'Check Answer' }).click();
  await expect(page.getByText('Correct', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Your answer')).toHaveValue('connection');
});

// Exercise deliberate keyboard submission, accessible dialog choices and durable review state
test('keyboard, completion dialog and persistent course review', async ({
  page,
}) => {
  await page.goto('/#/lesson/' + lessons[0].id);
  await page
    .getByRole('navigation', { name: 'Lesson Route' })
    .getByRole('button', { name: /^1\. / })
    .click();
  const input = page.getByLabel('Your answer');
  await input.fill('wrong');
  await input.press('Enter');
  await expect(
    page.getByRole('button', { name: 'Check Answer' }),
  ).toBeFocused();
  await expect(page.getByText(/0 checked attempts/)).toBeVisible();
  await page.keyboard.down('Enter');
  await page.keyboard.down('Enter');
  await page.keyboard.up('Enter');
  await expect(page.getByText(/1 checked attempts/)).toBeVisible();
  await expect(page.getByText('Not Correct Yet — Try Again')).toBeVisible();
  await page.getByRole('button', { name: 'Back To Dashboard' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Mark It As Completed' }),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Back To Dashboard' }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Back To Dashboard' }).click();
  await page.getByRole('button', { name: 'Mark It As Completed' }).click();
  await expect(dialog.getByText(/Finish these activities/)).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await dialog
    .getByRole('button', { name: 'Return To Activity 2', exact: true })
    .click();
  await expect(
    page.getByRole('heading', {
      name: lessons[0].tasks[1].prompt,
      exact: true,
    }),
  ).toBeVisible();
  await input.fill('unsaved connection');
  await page.getByRole('button', { name: 'Back To Dashboard' }).click();
  await page.getByRole('button', { name: 'Not Completed Yet' }).click();
  await expect(
    page.getByRole('heading', { name: 'Your courses' }),
  ).toBeVisible();
  await page.goto('/#/lesson/' + lessons[0].id);
  await expect(input).toHaveValue('unsaved connection');
  await page.getByRole('link', { name: 'Mistake Review', exact: true }).click();
  await expect(
    page
      .locator('#mistake-review')
      .getByRole('button', { name: 'English (1)', exact: true }),
  ).toBeVisible();
  await page
    .locator('#mistake-review')
    .getByRole('button', { name: 'Cybersecurity (0)', exact: true })
    .click();
  await expect(
    page.getByText('No active mistakes in Cybersecurity'),
  ).toBeVisible();
  await page
    .locator('#mistake-review')
    .getByRole('button', { name: 'English (1)', exact: true })
    .click();
  await expect(page.getByRole('table')).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: 'test-results/review-' + test.info().project.name + '.png',
    fullPage: true,
  });
  await page
    .locator('#mistake-review')
    .getByRole('button', { name: 'Remove', exact: true })
    .click();
  await expect(page.getByText('No active mistakes in English')).toBeVisible();
  await page
    .locator('#mistake-review')
    .getByRole('button', { name: 'Undo', exact: true })
    .click();
  await expect(
    page
      .locator('#mistake-review')
      .getByRole('button', { name: 'Review', exact: true }),
  ).toBeVisible();
  await page
    .locator('#mistake-review')
    .getByRole('button', { name: 'Remove', exact: true })
    .click();
  await page.reload();
  await expect(page.getByText('No active mistakes in English')).toBeVisible();
  await page.goto('/#/lesson/' + lessons[0].id);
  await page
    .getByRole('navigation', { name: 'Lesson Route' })
    .getByRole('button', { name: /^1\. / })
    .click();
  await expect(input).toHaveValue('wrong');
  await page.getByRole('button', { name: 'Check Answer' }).click();
  await expect(page.getByText(/2 checked attempts/)).toBeVisible();
  await page.getByRole('link', { name: 'Mistake Review', exact: true }).click();
  await expect(
    page
      .locator('#mistake-review')
      .getByRole('button', { name: 'English (1)', exact: true }),
  ).toBeVisible();
});

// Fail a pending draft during departure, then retry without losing the report fields
test('report resumes and dashboard departure waits for successful saves', async ({
  page,
}) => {
  const lesson = lessons[1];
  const task = lesson.tasks.find((task) => task.kind === 'report')!;
  await page.goto('/#/lesson/' + lesson.id);
  await page
    .getByRole('navigation', { name: 'Lesson Route' })
    .getByRole('button', {
      name: new RegExp('^' + (lesson.tasks.indexOf(task) + 1) + '\\. '),
    })
    .click();
  await answerTask(page, task);
  await expect(page.getByText(/^Answer saved/)).toBeVisible();
  await page.reload();
  await expect(page.getByLabel(/Source Host/)).toHaveValue('192.0.2.10');
  await expect(
    page.getByLabel(/Why This Evidence Supports Your Assessment/),
  ).toHaveValue(
    String(
      task.fields.find((field) => field.id === 'assessment-reason')!.example,
    ),
  );
  await page.route('**/api/progress/**', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Temporary departure failure' }),
    }),
  );
  await page.getByLabel(/Source Host/).fill('retained report draft');
  await page.getByRole('button', { name: 'Back To Dashboard' }).click();
  await expect(page.getByText('Save error', { exact: true })).toBeVisible();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByLabel(/Source Host/)).toHaveValue(
    'retained report draft',
  );
  await page.unroute('**/api/progress/**');
  await page.getByRole('button', { name: 'Enable Retry' }).click();
  await page.getByRole('button', { name: 'Back To Dashboard' }).click();
  await page.getByRole('button', { name: 'Not Completed Yet' }).click();
  await expect(
    page.getByRole('heading', { name: 'Your courses' }),
  ).toBeVisible();
  await page.goto('/#/lesson/' + lesson.id);
  await expect(page.getByLabel(/Source Host/)).toHaveValue(
    'retained report draft',
  );
});

// A failed completion write must keep the dialog and confirmed incomplete state until an explicit retry succeeds
test('completion save failure stays in the lesson and can be retried', async ({
  page,
}) => {
  const lesson = lessons[0];
  const url = '/api/progress/' + lesson.id;
  let revision = 0;
  for (const task of lesson.tasks) {
    for (const mutation of [
      { action: 'draft', taskId: task.id, answer: exampleAnswer(task) },
      {
        action: task.kind === 'written' ? 'selfReview' : 'check',
        taskId: task.id,
      },
    ]) {
      const response = await page.request.post(url, {
        data: { ...mutation, revision },
      });
      expect(response.ok()).toBe(true);
      revision = (await response.json()).revision;
    }
  }
  await page.goto('/#/lesson/' + lesson.id);
  await page.getByRole('button', { name: 'Back To Dashboard' }).click();
  await page.route('**/api/progress/**', (route) =>
    route.request().postDataJSON().action === 'complete'
      ? route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Completion could not be saved' }),
        })
      : route.continue(),
  );
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Mark It As Completed' }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('alert')).toContainText(
    'Completion could not be saved',
  );
  const snapshot = await (await page.request.get('/api/lessons')).json();
  expect(snapshot.progress[0].completedAt).toBeNull();
  await page.unroute('**/api/progress/**');
  await dialog.getByRole('button', { name: 'Enable Retry' }).click();
  await dialog.getByRole('button', { name: 'Mark It As Completed' }).click();
  await expect(
    page.getByRole('heading', { name: 'Your courses' }),
  ).toBeVisible();
  await page.goto('/#/lesson/' + lesson.id);
  await expect(
    page.getByRole('button', { name: 'Lesson Completed' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Back To Dashboard' }).click();
  await expect(
    page.getByRole('heading', { name: 'Your courses' }),
  ).toBeVisible();
});

// A delayed route save must keep the current draft visible and reject overlapping selections
test('route saves are locked, focus the target and preserve drafts on failure', async ({
  page,
}) => {
  await page.goto('/#/lesson/' + lessons[0].id);
  const route = page.getByRole('navigation', { name: 'Lesson Route' });
  await expect(page.getByLabel('Go to activity')).toHaveCount(0);
  await route.getByRole('button', { name: /^1\. / }).click();
  const heading = page.getByRole('heading', {
    name: lessons[0].tasks[0].prompt,
    exact: true,
  });
  await expect(heading).toBeFocused();
  await expect(heading).toBeInViewport();
  await page.getByLabel('Your answer').fill('latest route draft');
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/progress/**', async (request) => {
    if (request.request().postDataJSON().action === 'draft') await gate;
    await request.continue();
  });
  await route.getByRole('button', { name: /^2\. / }).press('Enter');
  await expect(route.getByRole('button', { name: /^3\. / })).toBeDisabled();
  await expect(heading).toBeVisible();
  release();
  await expect(
    page.getByRole('heading', {
      name: lessons[0].tasks[1].prompt,
      exact: true,
    }),
  ).toBeFocused();
  await page.unroute('**/api/progress/**');
  await route.getByRole('button', { name: /^1\. / }).click();
  await expect(page.getByLabel('Your answer')).toHaveValue(
    'latest route draft',
  );
  let writes = 0;
  page.on('request', (request) => {
    if (request.url().includes('/api/progress/')) writes++;
  });
  await route.getByRole('button', { name: /^1\. / }).click();
  expect(writes).toBe(0);
  await page.route('**/api/progress/**', (request) =>
    request.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Route save failed' }),
    }),
  );
  await page.getByLabel('Your answer').fill('retained after failure');
  await route.getByRole('button', { name: /^2\. / }).click();
  await expect(page.getByRole('alert')).toContainText('Route save failed');
  await expect(page.getByLabel('Your answer')).toHaveValue(
    'retained after failure',
  );
  await expect(heading).toBeVisible();
  await page.unroute('**/api/progress/**');
  await page.getByRole('button', { name: 'Enable Retry' }).click();
  await route.getByRole('button', { name: /^2\. / }).click();
  await expect(
    page.getByRole('heading', {
      name: lessons[0].tasks[1].prompt,
      exact: true,
    }),
  ).toBeFocused();
});

// Own notes copy wrong values verbatim, require overwrite consent and never reveal a model answer
test('report notes, overwrite confirmation, live preview and final activity controls', async ({
  page,
}) => {
  const lesson = lessons[1];
  await page.goto('/#/lesson/' + lesson.id);
  const route = page.getByRole('navigation', { name: 'Lesson Route' });
  await expect(page.locator('header .brand')).toHaveText('StudyLab');
  await expect(page.locator('header .brand')).toHaveCSS(
    'color',
    'rgb(0, 0, 0)',
  );
  await expect(page.locator('footer')).toHaveText('2026 | Study Lab');
  await route.getByRole('button', { name: /^1\. / }).click();
  await page.getByLabel('Your answer').fill('192.0.2.99');
  await page.getByRole('button', { name: 'Check Answer' }).click();
  await expect(page.getByText('Not Correct Yet — Try Again')).toBeVisible();
  await route.getByRole('button', { name: /^7\. / }).click();
  await expect(page.getByLabel('Source Host', { exact: true })).toHaveValue('');
  await page.getByText('My Investigation Notes', { exact: true }).click();
  const finding = page.locator('.investigation-notes article').filter({
    has: page.getByRole('heading', {
      name: lesson.tasks[0].prompt,
      exact: true,
    }),
  });
  await expect(finding).toContainText('192.0.2.99');
  await expect(finding).toContainText('Checked — Incorrect');
  await finding.getByRole('button', { name: /Use My Finding/ }).click();
  await expect(page.getByLabel('Source Host', { exact: true })).toHaveValue(
    '192.0.2.99',
  );
  await expect(page.getByText(/0 checked attempts/)).toBeVisible();
  await page
    .getByLabel('Source Host', { exact: true })
    .fill('keep my report value');
  await finding.getByRole('button', { name: /Use My Finding/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Keep Current Entry' }).click();
  await expect(page.getByLabel('Source Host', { exact: true })).toHaveValue(
    'keep my report value',
  );
  await finding.getByRole('button', { name: /Use My Finding/ }).click();
  await page.getByRole('button', { name: 'Replace Entry' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await finding.getByRole('button', { name: /Use My Finding/ }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('button', { name: 'Preview Report' }).click();
  await expect(
    page.getByRole('heading', { name: 'Your Report Preview' }),
  ).toBeFocused();
  await expect(page.locator('.learner-report-preview')).toContainText(
    '[Missing]',
  );
  await expect(page.locator('.learner-report-preview')).toContainText(
    '192.0.2.99',
  );
  await page.getByRole('button', { name: 'Return To Editing' }).click();
  await page
    .getByLabel('Source Host', { exact: true })
    .fill('<img src=x onerror=alert(1)>');
  await expect(page.locator('.learner-report-preview')).toContainText(
    '<img src=x onerror=alert(1)>',
  );
  await expect(page.locator('.learner-report-preview img')).toHaveCount(0);
  await page.route('**/api/progress/**', (request) =>
    request.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Report save unavailable' }),
    }),
  );
  await page.getByRole('button', { name: 'Check Report' }).click();
  await expect(
    page.getByText(
      'The report could not be saved or checked — your draft is still here',
    ),
  ).toBeVisible();
  await expect(page.getByLabel('Source Host', { exact: true })).toHaveValue(
    '<img src=x onerror=alert(1)>',
  );
  await page.unroute('**/api/progress/**');
  await page.getByRole('button', { name: 'Retry Report Check' }).click();
  await expect(page.getByText('Not Correct Yet — Try Again')).toBeVisible();
  await route
    .getByRole('button', {
      name: new RegExp('^' + lessons[1].tasks.length + '[.] '),
    })
    .click();
  await expect(
    page.getByRole('button', { name: /Save And Next Activity/ }),
  ).toHaveCount(0);
  await route.getByRole('button', { name: /^7\. / }).click();
  await expect(page.getByLabel('Source Host', { exact: true })).toHaveValue(
    '<img src=x onerror=alert(1)>',
  );
  await expect(
    page.getByRole('button', { name: /Save And Next Activity/ }),
  ).toBeVisible();
});
