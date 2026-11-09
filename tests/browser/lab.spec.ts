// Validate honest model controls and owner-only operations without executing host commands
import { test, expect } from './fixtures';
test.use({ ownerAi: true });
test('model starts explicitly, rejects shell access and pauses on request', async ({
  page,
  isMobile,
}) => {
  await page.goto('/#/lab');
  if (isMobile) {
    await expect(
      page.getByText(/Simulation labs require a desktop screen/),
    ).toBeVisible();
    await expect(page.getByLabel('Owner Token')).toHaveCount(0);
    await expect(page.getByLabel('Model Command')).toHaveCount(0);
    await page.getByRole('link', { name: 'Return To Endpoint Lesson' }).click();
    await page
      .getByRole('navigation', { name: 'Lesson Route' })
      .getByRole('button', { name: /^1\. / })
      .click();
    await expect(page.getByLabel('Your answer')).toBeVisible();
    return;
  }
  await expect(page.getByText(/not an operating-system shell/)).toBeVisible();
  await page
    .getByLabel('Owner Token')
    .fill('test-owner-capability-with-at-least-thirty-two-characters');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Run Command' })).toBeEnabled();
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

// Hold real server responses to reproduce the hosted command-erasure race without timing sleeps
test('model drafts survive delayed start and command responses', async ({
  page,
  isMobile,
}) => {
  await page.goto('/#/lab');
  if (isMobile) {
    await expect(
      page.getByText(/Simulation labs require a desktop screen/),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Run Command' })).toHaveCount(
      0,
    );
    return;
  }
  // Gate completed responses while retaining real server validation and revision updates
  let releaseStart!: () => void;
  let releaseCommand!: () => void;
  const startGate = new Promise<void>((resolve) => {
    releaseStart = resolve;
  });
  const commandGate = new Promise<void>((resolve) => {
    releaseCommand = resolve;
  });
  let startReceived = false;
  let commandReceived = false;
  await page.route('**/api/lab', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    const body = route.request().postDataJSON();
    const response = await route.fetch();
    if (body.action === 'start') {
      startReceived = true;
      await startGate;
    }
    if (body.action === 'command' && body.command === 'ps') {
      commandReceived = true;
      await commandGate;
    }
    await route.fulfill({ response });
  });
  await page
    .getByLabel('Owner Token')
    .fill('test-owner-capability-with-at-least-thirty-two-characters');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect.poll(() => startReceived).toBe(true);
  await page.getByLabel('Model Command').fill('ps');
  releaseStart();
  await expect(page.getByRole('button', { name: 'Run Command' })).toBeEnabled();
  await expect(page.getByLabel('Model Command')).toHaveValue('ps');
  await page.getByRole('button', { name: 'Run Command' }).click();
  await expect.poll(() => commandReceived).toBe(true);
  await page.getByLabel('Model Command').fill('ss');
  releaseCommand();
  await expect(page.getByText('portal pid=10', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Run Command' })).toBeEnabled();
  await expect(page.getByLabel('Model Command')).toHaveValue('ss');
});
