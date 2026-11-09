// Exercise review persistence and catalogue navigation against isolated learner databases
import { test, expect } from './fixtures';
import { lessons } from '../../src/shared/lessons.js';
import AxeBuilder from '@axe-core/playwright';

test('catalogue has ten lessons per course with usable course and completion filters', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByLabel('Course', { exact: true }).selectOption('English');
  await expect(page.locator('.course-card')).toHaveCount(10);
  await page
    .getByLabel('Course', { exact: true })
    .selectOption('Cybersecurity');
  await expect(page.locator('.course-card')).toHaveCount(10);
  await page
    .getByLabel('Completion', { exact: true })
    .selectOption('Completed');
  await expect(page.locator('.course-card')).toHaveCount(0);
  await page
    .getByLabel('Completion', { exact: true })
    .selectOption('Not Completed');
  await expect(page.locator('.course-card')).toHaveCount(10);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('review sessions survive refresh without modifying original assessed answers', async ({
  page,
}) => {
  await page.goto('/#/lesson/' + lessons[0].id);
  await page
    .getByRole('navigation', { name: 'Lesson Route' })
    .getByRole('button', { name: /^1\. / })
    .click();
  await page.getByLabel('Your answer').fill('wrong');
  await page.getByRole('button', { name: 'Check Answer' }).click();
  await expect(page.getByText('Not Correct Yet — Try Again')).toBeVisible();
  await page.getByRole('link', { name: 'Mistake Review', exact: true }).click();
  await page.getByRole('button', { name: 'Start Review' }).click();
  await page
    .locator('#review-due')
    .getByRole('button', { name: 'Remove', exact: true })
    .click();
  await expect(page.getByText('Item removed from active review')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Start Review' }).click();
  await expect(page.getByText('Item removed from active review')).toBeVisible();
  await page
    .locator('#review-due')
    .getByRole('button', { name: 'Undo', exact: true })
    .click();
  await page.getByLabel('Your answer').fill('action');
  await page.getByRole('button', { name: 'Check Answer' }).click();
  await expect(page.getByText(/Recorded — Next Review/)).toBeVisible();
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Your Courses' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Mistake Review', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Start Review' }).click();
  await expect(page.getByText(/Recorded — Next Review/)).toBeVisible();
  const snapshot = await (await page.request.get('/api/lessons')).json();
  expect(snapshot.progress[0].tasks.action.answer).toBe('wrong');
  expect(snapshot.progress[0].tasks.action.attempts).toBe(1);
  await page.getByRole('button', { name: 'Finish Session' }).click();
  await expect(page.getByText(/1 recorded results/)).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
