// Fill native activity controls from content-defined examples in isolated acceptance tests
import type { Page } from '@playwright/test';
import type { Task } from '../../src/shared/schema.js';
import { exampleAnswer } from '../../src/shared/domain.js';

// Fill the actual control chosen for each learning objective
export async function answerTask(
  page: Page,
  task: Task,
  advanceLab?: (ms: number) => void,
) {
  // Complete model questions through owner verification rather than forging a normal example check
  if (task.labScenario) {
    if (!advanceLab)
      throw Error('Lab acceptance requires its controlled scenario clock');
    await page
      .getByLabel('Owner Token', { exact: true })
      .fill('test-owner-capability-with-at-least-thirty-two-characters');
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    advanceLab(46000);
    for (const command of [
      'ps',
      'accounts',
      'ss',
      'journalctl',
      'block 198.51.100.99',
      'disable lab-test',
      'stop probe',
    ]) {
      await page.getByLabel('Model Command').fill(command);
      await page.getByRole('button', { name: 'Run Command' }).click();
      await page.waitForFunction(
        () =>
          document.querySelector<HTMLInputElement>('input[maxlength="100"]')
            ?.value === '',
      );
    }
    await page.getByRole('button', { name: 'Verify Lab Question' }).click();
    return;
  }
  const answer = exampleAnswer(task);
  if (task.kind === 'report') {
    for (const field of task.fields) {
      const control = page.getByLabel(field.label, { exact: true });
      if (field.kind === 'multiple') {
        for (const id of field.example as string[])
          await page
            .getByRole('group', { name: field.label, exact: true })
            .getByRole('checkbox', {
              name: field.options.find((option) => option.id === id)!.label,
              exact: true,
            })
            .check();
      } else if (field.kind === 'select')
        await control.selectOption(String(field.example));
      else await control.fill(String(field.example));
    }
  } else if (task.kind === 'multiple') {
    for (const option of task.options)
      if (task.answers.includes(option.id))
        await page
          .getByRole('checkbox', { name: option.label, exact: true })
          .check();
  } else if (task.kind === 'choice')
    await page
      .getByRole('radio', {
        name: task.options.find((option) => option.id === answer)!.label,
        exact: true,
      })
      .check();
  else if (task.kind === 'select')
    await page.getByLabel('Your answer').selectOption(String(answer));
  else await page.getByLabel('Your answer').fill(String(answer));
}
