import { test, expect } from '@playwright/test';

const appUrl = process.env.APP_URL;
const sessionCookieValue = process.env.REMOTE_SESSION_COOKIE_VALUE;
const sessionCookieName = process.env.REMOTE_SESSION_COOKIE_NAME || '__session';
const expectedSessionEmail = process.env.REMOTE_SESSION_EMAIL || '';
const expectSupportData = process.env.EXPECT_SUPPORT_DATA === 'true';

test.describe('deployed support panel', () => {
  test('cookie-session で support panel を表示できる', async ({ page, context }) => {
    test.skip(!appUrl, 'APP_URL is required for deployed support panel smoke');
    test.skip(!sessionCookieValue, 'REMOTE_SESSION_COOKIE_VALUE is required for deployed support panel smoke');

    const url = new URL(appUrl as string);
    await context.addCookies([
      {
        name: sessionCookieName,
        value: sessionCookieValue as string,
        domain: url.hostname,
        path: '/',
        httpOnly: true,
        secure: url.protocol === 'https:',
        sameSite: 'Lax',
      },
    ]);

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: '運用ログ' })).toBeVisible();
    await expect(page.getByText('remote / cookie-session 構成で保存された feedback と generation audit を read-only で確認します。')).toBeVisible();
    await expect(page.getByText('feedback store:')).toBeVisible();
    await expect(page.getByText('audit store:')).toBeVisible();

    if (expectedSessionEmail) {
      await expect(page.getByText(`閲覧中: ${expectedSessionEmail}`)).toBeVisible();
    }

    await page.getByRole('button', { name: '再読み込み' }).click();
    await expect(page.locator('.support-panel .generation-status-error')).toHaveCount(0);

    if (expectSupportData) {
      await expect(page.locator('.support-list-item').first()).toBeVisible();
    }
  });
});
