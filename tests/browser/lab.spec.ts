// Validate honest model controls and owner-only operations without executing host commands
import { test, expect } from './fixtures';
test.use({ ownerAi: true });
test('model starts explicitly, rejects shell access and pauses on request', async ({
  page,
}) => {
  await page.goto('/#/lab');
  await expect(page.getByText(/not an operating-system shell/)).toBeVisible();
  await page
    .getByLabel('Owner Token')
    .fill('test-owner-capability-with-at-least-thirty-two-characters');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByLabel('Model Command').fill('ps');
  await page.getByRole('button', { name: 'Run Command' }).click();
  await expect(page.getByText('portal pid=10', { exact: true })).toBeVisible();
  await page.getByLabel('Model Command').fill('cat /etc/passwd');
  await page.getByRole('button', { name: 'Run Command' }).click();
  await expect(page.getByRole('alert')).toContainText(
    'Unsupported model command',
  );
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Run Command' }),
  ).toBeDisabled();
});
