// Give each additional lesson its own isolated acceptance case instead of extending one test timeout
import { test, expect } from './fixtures';
import { lessons } from '../../src/shared/lessons.js';
import { answerTask } from './answers';
import AxeBuilder from '@axe-core/playwright';
test.use({ ownerAi: true });

for (const lesson of lessons.slice(2))
  test(
    'complete ' + lesson.id + ' offline with its real controls',
    async ({ page, context, advanceLab }) => {
      const external: string[] = [];
      await context.route('**/*', (route) => {
        const url = new URL(route.request().url());
        if (url.hostname !== '127.0.0.1') {
          external.push(url.href);
          return route.abort();
        }
        return route.continue();
      });
      await page.goto('/#/lesson/' + lesson.id);
      await expect(
        page.getByRole('heading', { name: lesson.title, exact: true }),
      ).toBeVisible();
      for (const [index, task] of lesson.tasks.entries()) {
        await page
          .getByRole('navigation', { name: 'Lesson Route' })
          .getByRole('button', { name: new RegExp('^' + (index + 1) + '\\. ') })
          .click();
        await expect(
          page.getByRole('heading', { name: task.prompt, exact: true }),
        ).toBeFocused();
        await expect(
          page.getByRole('button', { name: /Save And Next Activity/ }),
        ).toHaveCount(index < lesson.tasks.length - 1 ? 1 : 0);
        await answerTask(page, task, advanceLab);
        if (task.kind !== 'written' && !task.labScenario) {
          await page
            .getByRole('button', {
              name: task.kind === 'report' ? 'Check Report' : 'Check Answer',
              exact: true,
            })
            .click();
          await expect(
            page.getByText(
              task.kind === 'report'
                ? 'Objective Report Checks Met'
                : 'Correct',
              { exact: true },
            ),
          ).toBeVisible();
        }
        if (task.labScenario)
          await expect(
            page.getByText('Correct', { exact: true }),
          ).toBeVisible();
        if (task.kind === 'report') {
          await page.getByRole('button', { name: 'Preview Report' }).click();
          await expect(
            page.locator('.learner-report-preview'),
          ).not.toContainText('[Missing]');
          await page.getByRole('button', { name: 'Return To Editing' }).click();
        }
        if (['written', 'report'].includes(task.kind)) {
          await page.getByLabel(/I compared my response/).check();
          await page
            .getByRole('button', { name: 'Record Self-Review' })
            .click();
          await expect(page.getByText(/Self-review recorded/)).toBeVisible();
        }
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      }
      await page.getByRole('button', { name: 'Mark Lesson Complete' }).click();
      await expect(
        page.getByRole('button', { name: 'Lesson Completed' }),
      ).toBeVisible();
      await page.reload();
      await expect(
        page.getByRole('button', { name: 'Lesson Completed' }),
      ).toBeVisible();
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      expect(external).toEqual([]);
    },
  );
