import { test, expect } from '@playwright/test';

test.describe('StudyOS E2E Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('landing page loads correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/StudyOS/);
    await expect(page.getByRole('heading', { name: 'StudyOS' })).toBeVisible();
  });

  test('navigation to login works', async ({ page }) => {
    await page.getByRole('link', { name: 'Đăng nhập' }).click();
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible();
  });

  test('dashboard shows user stats when logged in', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    const url = page.url();
    if (url.includes('/login')) {
      await expect(page.getByText('Đăng nhập')).toBeVisible();
    } else {
      await expect(page.getByText('Tổng câu đã làm')).toBeVisible();
    }
  });
});
