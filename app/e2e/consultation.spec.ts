import { test, expect } from '@playwright/test';

async function resetPage(page: import('@playwright/test').Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('h1');
}

test.describe('Consultation モード', () => {
  test.beforeEach(async ({ page }) => {
    await resetPage(page);
  });

  test('初期表示で相談結果モードが選択されている', async ({ page }) => {
    const consultationSection = page.locator('.consultation-section');
    await expect(consultationSection).toBeVisible();
  });

  test('相談の種類セレクトが3つの選択肢を持つ', async ({ page }) => {
    const select = page.locator('#consultationPromptVariant');
    await expect(select).toBeVisible();
    const options = select.locator('option');
    await expect(options).toHaveCount(3);
  });

  test('テスト入力ボタンで consultation テキストが反映される', async ({ page }) => {
    await page.getByRole('button', { name: '相談結果のテスト入力を適用' }).click();

    const textarea = page.locator('#consultationInput');
    await expect(textarea).not.toBeEmpty();

    const value = await textarea.inputValue();
    expect(value).toContain('プロジェクト概要');
    expect(value).toContain('想定ユーザー');
  });

  test('draft 作成ボタンで draft が生成される', async ({ page }) => {
    await page.getByRole('button', { name: '相談結果のテスト入力を適用' }).click();
    await page.getByRole('button', { name: 'draft を作成' }).click();

    const reviewSection = page.locator('.consultation-review');
    await expect(reviewSection).toBeVisible();

    await expect(page.locator('.consultation-card').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'この draft をフォームへ反映' })).toBeVisible();
  });

  test('draft をフォームへ反映すると詳細入力モードに切り替わる', async ({ page }) => {
    await page.getByRole('button', { name: '相談結果のテスト入力を適用' }).click();
    await page.getByRole('button', { name: 'draft を作成' }).click();
    await page.getByRole('button', { name: 'この draft をフォームへ反映' }).click();

    const projectHeader = page.locator('h2').filter({ hasText: 'プロジェクト情報' });
    await expect(projectHeader).toBeVisible();
  });
});

test.describe('JSON 出力', () => {
  test.beforeEach(async ({ page }) => {
    await resetPage(page);
  });

  test('テスト入力後の JSON プレビューに specVersion: "1.0" が含まれる', async ({ page }) => {
    await page.getByRole('button', { name: '詳細入力のテスト入力を適用' }).click();

    const jsonPreview = page.locator('.json-preview pre');
    await expect(jsonPreview).toBeVisible();

    const jsonText = await jsonPreview.textContent();
    expect(jsonText).toBeTruthy();

    const parsed = JSON.parse(jsonText!);
    expect(parsed.specVersion).toBe('1.0');
  });

  test('JSON プレビューに必須フィールドが含まれる', async ({ page }) => {
    await page.getByRole('button', { name: '詳細入力のテスト入力を適用' }).click();

    const jsonPreview = page.locator('.json-preview pre');
    const jsonText = await jsonPreview.textContent();
    const parsed = JSON.parse(jsonText!);

    expect(parsed).toHaveProperty('specVersion');
    expect(parsed).toHaveProperty('project');
    expect(parsed).toHaveProperty('tech');
    expect(parsed).toHaveProperty('security');
    expect(parsed).toHaveProperty('structure');
    expect(parsed).toHaveProperty('workflow');
    expect(parsed.project.name).toBeTruthy();
    expect(parsed.project.slug).toBeTruthy();
  });

  test('consultation draft 反映後の JSON にも specVersion が含まれる', async ({ page }) => {
    await page.getByRole('button', { name: '相談結果のテスト入力を適用' }).click();
    await page.getByRole('button', { name: 'draft を作成' }).click();
    await page.getByRole('button', { name: 'この draft をフォームへ反映' }).click();

    const jsonPreview = page.locator('.json-preview pre');
    await expect(jsonPreview).toBeVisible();

    const jsonText = await jsonPreview.textContent();
    const parsed = JSON.parse(jsonText!);
    expect(parsed.specVersion).toBe('1.0');
  });
});

test.describe('入力モード切り替え', () => {
  test.beforeEach(async ({ page }) => {
    await resetPage(page);
  });

  test('詳細入力モードに切り替えるとフォームセクションが表示される', async ({ page }) => {
    const detailLabel = page.locator('label').filter({ hasText: '詳細入力' });
    await detailLabel.click();

    const projectHeader = page.locator('h2').filter({ hasText: 'プロジェクト情報' });
    await expect(projectHeader).toBeVisible();
  });

  test('Reset ボタンで初期状態に戻る', async ({ page }) => {
    await page.getByRole('button', { name: '詳細入力のテスト入力を適用' }).click();
    await page.getByRole('button', { name: 'Reset' }).click();

    const consultationSection = page.locator('.consultation-section');
    await expect(consultationSection).toBeVisible();
  });
});
