// Keep optional AI transport mocked and separate from external-network-free core learning
import { test, expect } from './fixtures';
import { lessons } from '../../src/shared/lessons.js';
test.use({ ownerAi: true });

test('owner connection, consent and mocked feedback leave the writing draft and completion intact', async ({
  page,
}) => {
  await page.goto('/#/ai');
  await page
    .getByLabel('Owner Token')
    .fill('test-owner-capability-with-at-least-thirty-two-characters');
  await page.getByRole('button', { name: 'Unlock AI Controls' }).click();
  await page
    .getByLabel('OpenAI API Key')
    .fill('not-a-real-provider-key-for-tests');
  await page.getByRole('button', { name: 'Connect OpenAI API' }).click();
  await expect(page.getByText(/Connection Status: Connected/)).toBeVisible();
  await expect(page.getByLabel('OpenAI API Key')).toHaveValue('');
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  await page.getByRole('button', { name: 'Test Connection' }).click();
  await expect(
    page.getByText('Connection tested', { exact: true }),
  ).toBeVisible();
  await page.goto('/#/lesson/' + lessons[0].id);
  await page.reload();

  // Full page navigation clears the transient capability, so unlock again through in-app navigation
  await page.getByRole('link', { name: 'AI Settings', exact: true }).click();
  await page
    .getByLabel('Owner Token')
    .fill('test-owner-capability-with-at-least-thirty-two-characters');
  await page.getByRole('button', { name: 'Unlock AI Controls' }).click();
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
  await page.locator(`a[href="#/lesson/${lessons[0].id}"]`).first().click();
  await page
    .getByRole('navigation', { name: 'Lesson Route' })
    .getByRole('button', { name: /^7\. / })
    .click();
  await page
    .getByLabel('Your answer')
    .fill('The connection failed and Jo will inspect the spare device');
  await page.getByText('Optional AI Feedback', { exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Review My Answer' }),
  ).toBeDisabled();
  await page.getByLabel(/I agree to send this saved answer/).check();
  await page.getByRole('button', { name: 'Review My Answer' }).click();
  await expect(
    page.getByRole('heading', { name: 'AI-Generated Feedback' }),
  ).toBeVisible();
  await expect(page.getByLabel('Your answer')).toHaveValue(
    'The connection failed and Jo will inspect the spare device',
  );
  const snapshot = await (await page.request.get('/api/lessons')).json();
  expect(snapshot.progress[0].completedAt).toBeNull();
  expect(snapshot.progress[0].tasks['own-note'].reviewed).toBe(false);
  expect(snapshot.progress[0].tasks['own-note'].aiHelp).toBe(1);
  await page.getByRole('link', { name: 'AI Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Disconnect', exact: true }).click();
  await expect(page.getByText(/Connection Status: Disconnected/)).toBeVisible();
});
