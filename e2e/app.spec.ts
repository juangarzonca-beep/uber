import { expect, test } from '@playwright/test';

test('redirects the app root to login', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Uber' })).toBeVisible();
});
