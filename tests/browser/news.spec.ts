// Exercise explicit news publication, unchanged active quizzes and shared snapshot answers using a mocked feed
import { test, expect } from './fixtures';
import { answerTask } from './answers';
test.use({ ownerAi: true });
test('fresh reading keeps the active selection, shares its exact snapshot and survives a failed update', async ({
  page,
}) => {
  await page.goto('/#/quiz');
  await page.getByLabel('Your answer').waitFor();
  const session = await (await page.request.get('/api/quiz')).json();
  await page.getByText('Optional Fresh News', { exact: true }).click();
  await page
    .getByLabel('News Owner Token')
    .fill('test-owner-capability-with-at-least-thirty-two-characters');
  await page.getByRole('button', { name: 'Update News', exact: true }).click();
  await expect(page.getByText(/Validated snapshot added/)).toBeVisible();
  expect((await (await page.request.get('/api/quiz')).json()).id).toBe(
    session.id,
  );
  const catalogue = await (await page.request.get('/api/lessons')).json();
  const lesson = catalogue.lessons.find(
    (lesson: { id: string }) => lesson.id === 'english-evidence-language',
  );
  const task = lesson.tasks.find((task: { id: string }) =>
    task.id.startsWith('fresh-'),
  );
  expect(task.passage.text).toContain('Fictional test region');
  await page.route('**/api/news/update', (route) =>
    route.fulfill({
      status: 502,
      contentType: 'application/json',
      body: JSON.stringify({
        error:
          'News update failed — previous offline reading remains available',
      }),
    }),
  );
  await page
    .getByLabel('News Owner Token')
    .fill('test-owner-capability-with-at-least-thirty-two-characters');
  await page.getByRole('button', { name: 'Update News', exact: true }).click();
  await expect(
    page.getByText(/previous offline reading remains available/),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
  await page
    .locator('a[href="#/lesson/english-evidence-language"]')
    .first()
    .click();
  await page
    .getByRole('navigation', { name: 'Lesson Route' })
    .getByRole('button', {
      name: new RegExp('^' + lesson.tasks.length + '[.] '),
    })
    .click();
  await expect(
    page.getByRole('region', { name: 'Reading Passage' }),
  ).toContainText(task.passage.text);
  await answerTask(page, task);
  await page.getByRole('button', { name: 'Check Report', exact: true }).click();
  await expect(
    page.getByText('Objective Report Checks Met', { exact: true }),
  ).toBeVisible();

  // Hold the prerequisite draft response to prove a click is not a confirmed self-review save
  let releaseDraft!: () => void;
  const draftGate = new Promise<void>((resolve) => {
    releaseDraft = resolve;
  });
  let draftReceived = false;
  await page.route(
    '**/api/progress/english-evidence-language',
    async (route) => {
      if (route.request().postDataJSON().action !== 'draft')
        return route.continue();
      const response = await route.fetch();
      draftReceived = true;
      await draftGate;
      await route.fulfill({ response });
    },
  );
  await page.getByLabel(/I compared my response/).check();
  await page.getByRole('button', { name: 'Record Self-Review' }).click();
  await expect.poll(() => draftReceived).toBe(true);
  await expect(page.getByText(/Self-review recorded/)).toHaveCount(0);
  releaseDraft();

  // Wait for the confirmed review result before testing its persistence across a full document reload
  await expect(page.getByText(/Self-review recorded/)).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('region', { name: 'Reading Passage' }),
  ).toContainText(task.passage.text);
  await expect(page.getByText(/Self-review recorded/)).toBeVisible();
});
