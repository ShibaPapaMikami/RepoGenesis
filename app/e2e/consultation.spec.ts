import { test, expect } from '@playwright/test';

async function resetPage(page: import('@playwright/test').Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('h1');
}

async function enterPasteStep(page: import('@playwright/test').Page, options: { testMode?: boolean } = {}) {
  await resetPage(page);
  await page.getByRole('button', { name: '相談を始める' }).click();
  await expect(page.locator('.consultation-section')).toBeVisible();
  await expect(page.getByRole('heading', { name: '相談内容を貼り付け' })).toBeVisible();

  if (options.testMode) {
    await page.getByLabel('テストモード').check();
    await expect(page.locator('#consultationTestTemplate')).toBeVisible();
  }
}

async function applyConsultationTestTemplate(page: import('@playwright/test').Page) {
  await page.locator('#consultationTestTemplate').selectOption('test_internal_faq_portal');
  await page.getByRole('button', { name: 'テスト文章を貼り付け欄に反映' }).click();
  await expect(page.locator('#consultationInput')).not.toBeEmpty();
}

async function buildDraft(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'ドラフトを作成' }).click();
  await expect(page.getByRole('heading', { name: 'ドラフト確認' })).toBeVisible();
  await expect(page.locator('.consultation-card').first()).toBeVisible();
}

async function reachResultStep(page: import('@playwright/test').Page) {
  await enterPasteStep(page, { testMode: true });
  await applyConsultationTestTemplate(page);
  await buildDraft(page);
  await page.getByRole('button', { name: 'この内容で進む' }).click();
  await expect(page.getByRole('heading', { name: 'おすすめオプション' })).toBeVisible();

  await page.getByRole('button', { name: '詳細調整へ進む' }).click();
  await expect(page.getByRole('heading', { name: '詳細調整' })).toBeVisible();

  await page.getByRole('button', { name: '最終確認へ進む' }).click();
  await expect(page.getByRole('heading', { name: '最終確認' })).toBeVisible();

  await page.getByRole('button', { name: 'ZIP生成へ進む' }).click();
  await expect(page.getByRole('heading', { name: 'Step 7. ZIP生成と結果' })).toBeVisible();
}

test.describe('相談 wizard', () => {
  test('初期表示で intro step が表示される', async ({ page }) => {
    await resetPage(page);

    await expect(page.locator('.intro-section')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'このツールでできること' })).toBeVisible();
    await expect(page.getByRole('button', { name: '相談を始める' })).toBeVisible();
  });

  test('相談開始で paste step に進める', async ({ page }) => {
    await enterPasteStep(page);

    await expect(page.locator('#consultationPromptVariant')).toBeVisible();
    await expect(page.locator('#consultationInput')).toBeVisible();
  });

  test('相談の種類セレクトが4つの選択肢を持つ', async ({ page }) => {
    await enterPasteStep(page);

    const options = page.locator('#consultationPromptVariant option');
    await expect(options).toHaveCount(4);
  });

  test('テストモードで固定テスト文章を貼り付け欄へ反映できる', async ({ page }) => {
    await enterPasteStep(page, { testMode: true });
    await applyConsultationTestTemplate(page);

    const value = await page.locator('#consultationInput').inputValue();
    expect(value).toContain('プロジェクト概要');
    expect(value).toContain('想定ユーザー');
  });

  test('ドラフト作成後に options step へ進める', async ({ page }) => {
    await enterPasteStep(page, { testMode: true });
    await applyConsultationTestTemplate(page);
    await buildDraft(page);

    await page.getByRole('button', { name: 'この内容で進む' }).click();
    await expect(page.getByRole('heading', { name: 'おすすめオプション' })).toBeVisible();
    await expect(page.getByText('Repo Readiness Review', { exact: true })).toBeVisible();
  });

  test('結果 step の JSON プレビューに specVersion が含まれる', async ({ page }) => {
    await reachResultStep(page);
    await page.getByText('JSONプレビューを確認').click();

    const jsonText = await page.locator('.json-preview pre').textContent();
    const parsed = JSON.parse(jsonText ?? '{}');
    expect(parsed.specVersion).toBe('1.0');
  });

  test('結果 step の JSON に必須フィールドが含まれる', async ({ page }) => {
    await reachResultStep(page);
    await page.getByText('JSONプレビューを確認').click();

    const jsonText = await page.locator('.json-preview pre').textContent();
    const parsed = JSON.parse(jsonText ?? '{}');

    expect(parsed).toHaveProperty('specVersion');
    expect(parsed).toHaveProperty('project');
    expect(parsed).toHaveProperty('tech');
    expect(parsed).toHaveProperty('security');
    expect(parsed).toHaveProperty('structure');
    expect(parsed).toHaveProperty('workflow');
  });

  test('リセットして始めからで intro step に戻る', async ({ page }) => {
    await enterPasteStep(page);
    await page.getByRole('button', { name: 'リセットして始めから' }).click();

    await expect(page.locator('.intro-section')).toBeVisible();
    await expect(page.getByRole('button', { name: '相談を始める' })).toBeVisible();
  });
});
