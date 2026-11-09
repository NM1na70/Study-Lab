// Exercise the agreed compact layout and shared question presentation using isolated browser fixtures
import { test, expect } from './fixtures';
import { lessons } from '../../src/shared/lessons.js';
import { answerTask } from './answers';
import AxeBuilder from '@axe-core/playwright';

// Keep resume behaviour independent of display filters while preserving the simplified header and mobile layout
test('compact dashboard retains filters, counts and the latest unfinished lesson', async ({
  page,
}) => {
  const lesson = lessons.find(
    (lesson) => lesson.id === 'english-workplace-emails',
  )!;
  const step = lesson.tasks.findIndex((task) => task.id === 'email') + 1;
  expect(
    (
      await page.request.post('/api/progress/' + lesson.id, {
        data: { action: 'step', revision: 0, step },
      })
    ).ok(),
  ).toBe(true);
  await page.goto('/');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Your Courses' }),
  ).toBeVisible();
  await expect(
    page.getByText('Your Local Learning Workspace', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('No Accounts · No AI Required', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      /A little practice|Build your English|Learn at your own pace/,
    ),
  ).toHaveCount(0);
  await expect(page.getByRole('link', { name: /^Review Due/ })).toHaveCount(0);
  await expect(page.locator('.stats strong')).toHaveText('0/ 20');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByLabel('Course', { exact: true }).selectOption('English');
  await expect(page.locator('.course-card')).toHaveCount(10);
  await page
    .getByLabel('Topic', { exact: true })
    .selectOption(lesson.topics[0]);
  await expect(page.locator('.course-card')).toHaveCount(
    lessons.filter(
      (item) =>
        item.course === 'English' && item.topics.includes(lesson.topics[0]),
    ).length,
  );
  await page
    .getByLabel('Completion', { exact: true })
    .selectOption('Completed');
  await expect(page.locator('.course-card')).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: /Continue Studying/ }),
  ).toHaveAttribute('href', '#/lesson/' + lesson.id);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('link', { name: /Continue Studying/ }).click();
  await expect(
    page.getByRole('heading', {
      name: lesson.tasks[step - 1].prompt,
      exact: true,
    }),
  ).toBeVisible();
});

// Check authored exercise separation, exact solution styling and professionally separated email paragraphs
test('request instructions, short solutions and email examples have distinct readable structure', async ({
  page,
}) => {
  const lesson = lessons.find(
    (lesson) => lesson.id === 'english-workplace-emails',
  )!;
  await page.goto('/#/lesson/' + lesson.id);
  const route = page.getByRole('navigation', { name: 'Lesson Route' });
  await route.getByRole('button', { name: /^4\. / }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Complete the request with a polite word',
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator('.question-exercise')).toHaveText(
    '___ send the revised list',
  );
  await page
    .getByRole('button', { name: 'Reveal Full Solution', exact: true })
    .click();
  await expect(page.locator('.solution h3')).toHaveText('Full Solution');
  await expect(page.locator('.solution-answer strong')).toHaveText('Please');
  const difference = await page
    .locator('.solution')
    .evaluate(
      (panel) =>
        parseFloat(getComputedStyle(panel.querySelector('h3')!).fontSize) -
        parseFloat(getComputedStyle(panel).fontSize),
    );
  expect(difference).toBeCloseTo(2, 1);
  await route.getByRole('button', { name: /^5\. / }).click();
  await page
    .getByRole('button', { name: 'Reveal Example Answer', exact: true })
    .click();
  await expect(page.locator('.solution h3')).toHaveText('Example Answer');
  expect(await page.locator('.written-example').textContent()).toBe(
    lesson.tasks.find((task) => task.id === 'email')!.example,
  );
  await expect(page.locator('.written-example')).toHaveCSS(
    'white-space',
    'pre-wrap',
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

// Use the same objective feedback and example renderer for English reading and Cybersecurity report activities
for (const id of ['english-workplace-emails', 'cyber-investigation-report']) {
  test(
    'report feedback and labelled examples preserve learner work in ' + id,
    async ({ page }) => {
      const lesson = lessons.find((lesson) => lesson.id === id)!;
      const task = lesson.tasks.find((task) => task.kind === 'report')!;
      const fields = task.fields.filter((field) => field.kind !== 'reasoning');
      const correct = fields.find((field) => field.kind === 'select')!;
      const wrong = fields.find((field) => field.kind === 'short')!;
      const missing = fields.find(
        (field) => field.id !== correct.id && field.id !== wrong.id,
      )!;
      await page.goto('/#/lesson/' + id);
      await page
        .getByRole('navigation', { name: 'Lesson Route' })
        .getByRole('button', {
          name: new RegExp('^' + (lesson.tasks.indexOf(task) + 1) + '[.] '),
        })
        .click();
      await page
        .getByLabel(correct.label, { exact: true })
        .selectOption(String(correct.example));
      await page
        .getByLabel(wrong.label, { exact: true })
        .fill('My incorrect entry');
      await page
        .getByRole('button', { name: 'Check Report', exact: true })
        .click();
      const feedback = page.locator('.checked-report-fields');
      await expect(feedback.locator('li')).toHaveCount(fields.length);
      await expect(
        feedback.locator('li').filter({
          has: page.getByText(correct.label + ':', { exact: true }),
        }),
      ).toContainText('— Correct');
      await expect(
        feedback
          .locator('li')
          .filter({ has: page.getByText(wrong.label + ':', { exact: true }) }),
      ).toContainText('My incorrect entry — Wrong');
      await expect(
        feedback.locator('li').filter({
          has: page.getByText(missing.label + ':', { exact: true }),
        }),
      ).toContainText('— Not Answered');
      await expect(
        page.getByText(
          'Reasoning: Self-Review Required — Not Automatically Graded',
        ),
      ).toBeVisible();
      await page
        .getByRole('button', { name: 'Reveal Example Report', exact: true })
        .click();
      await expect(page.locator('.solution h3')).toHaveText('Example Report');
      await expect(page.locator('.example-report-fields li')).toHaveCount(
        task.fields.length,
      );
      await expect(page.locator('.solution')).not.toContainText('— Correct');
      await expect(page.locator('.solution')).not.toContainText('— Wrong');
      await expect(page.getByLabel(wrong.label, { exact: true })).toHaveValue(
        'My incorrect entry',
      );
      await page
        .getByRole('button', { name: 'Preview Report', exact: true })
        .click();
      await expect(page.locator('.learner-report-preview')).toContainText(
        'My incorrect entry',
      );
      await page.getByLabel(wrong.label, { exact: true }).fill('Changed draft');
      await expect(feedback).toHaveCount(0);
      await expect(
        page.getByText('Answer changed — check again to update feedback'),
      ).toBeVisible();
      await answerTask(page, task);
      await page
        .getByRole('button', { name: 'Check Report', exact: true })
        .click();
      await expect(
        page.getByText('Objective Report Checks Met', { exact: true }),
      ).toBeVisible();
      await expect(feedback.locator('li')).toHaveCount(fields.length);
      for (const field of fields)
        await expect(
          feedback.locator('li').filter({
            has: page.getByText(field.label + ':', { exact: true }),
          }),
        ).toContainText('— Correct');
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    },
  );
}
