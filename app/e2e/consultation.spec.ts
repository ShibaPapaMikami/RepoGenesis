import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import bundledGenerator from '../src/vendor/generateFromSpec.js';
import type { ProjectSpec } from '../src/types/projectBrief.ts';
import { createZipBlob } from '../src/utils/simpleZip.ts';

type GenerateFromSpecFn = (
  input: ProjectSpec,
  options: {
    source: 'projectSpec';
    specVersion: ProjectSpec['specVersion'];
    generatorVersion: string;
    selectedSkills: Array<{
      id: string;
      name: string;
      version: string;
      sourceType: 'official' | 'curated' | 'internal';
      providers: Array<'codex' | 'claude_code' | 'gemini_cli' | 'tool_agnostic'>;
    }>;
  },
) => Map<string, string>;

const generateFromSpec = bundledGenerator.generateFromSpec as GenerateFromSpecFn;

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

  test('options step で AI 推奨の採用と上書きを明示できる', async ({ page }) => {
    await enterPasteStep(page, { testMode: true });
    await applyConsultationTestTemplate(page);
    await buildDraft(page);

    await page.getByRole('button', { name: 'この内容で進む' }).click();
    await expect(page.getByRole('heading', { name: 'おすすめオプション' })).toBeVisible();

    const repoCard = page.locator('.consultation-card').filter({
      has: page.getByRole('heading', { name: 'リポジトリ構成' }),
    });
    await expect(repoCard.getByText('AI推奨: 未確認')).toBeVisible();
    await repoCard.getByRole('button', { name: 'この推奨を採用' }).click();
    await expect(repoCard.getByText('AI推奨: 採用')).toBeVisible();

    const securityCard = page.locator('.consultation-card').filter({
      has: page.getByRole('heading', { name: 'security 水準' }),
    });
    await securityCard.getByRole('button', { name: '別の値で進める' }).click();
    await expect(securityCard.getByText('AI推奨: 上書き済み')).toBeVisible();
  });

  test('ドラフト確認で外部AI向けの要件整理プロンプトを表示できる', async ({ page }) => {
    await enterPasteStep(page, { testMode: true });
    await applyConsultationTestTemplate(page);
    await buildDraft(page);

    await expect(page.getByText('外部AIで要件をもう一段詰める')).toBeVisible();
    await expect(page.getByRole('button', { name: '要件整理プロンプトをコピー' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Markdownを保存' })).toBeVisible();
    await page.getByText('プロンプトを確認').click();
    await expect(page.locator('.refinement-prompt-preview pre')).toContainText('## RepoGenesis入力候補');
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

  test('最終確認で現在の設定を含む要件整理プロンプトを表示できる', async ({ page }) => {
    await enterPasteStep(page, { testMode: true });
    await applyConsultationTestTemplate(page);
    await buildDraft(page);
    await page.getByRole('button', { name: 'この内容で進む' }).click();
    await page.getByRole('button', { name: '詳細調整へ進む' }).click();
    await page.getByRole('button', { name: '最終確認へ進む' }).click();

    await expect(page.getByText('この状態で外部AIに再相談する')).toBeVisible();
    await page.getByText('プロンプトを確認').click();
    await expect(page.locator('.refinement-prompt-preview pre')).toContainText('### 現在のフォーム設定');
  });

  test('remote ZIP に operational runbook bundle が含まれる', async ({ page }, testInfo) => {
    let capturedCredentials: string | null | undefined;
    await page.route('**/repositories/generate', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': 'http://localhost:5173',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
          },
        });
        return;
      }

      capturedCredentials = await route.request().headerValue('cookie');
      const payload = route.request().postDataJSON() as {
        spec: ProjectSpec;
        meta?: {
          selectedSkills?: Array<{
            id: string;
            name: string;
            version: string;
            sourceType: 'official' | 'curated' | 'internal';
            providers: Array<'codex' | 'claude_code' | 'gemini_cli' | 'tool_agnostic'>;
          }>;
        };
      };
      const selectedSkills = Array.isArray(payload.meta?.selectedSkills) ? payload.meta.selectedSkills : [];
      const files = generateFromSpec(payload.spec, {
        source: 'projectSpec',
        specVersion: payload.spec.specVersion,
        generatorVersion: 'playwright-remote',
        selectedSkills,
      });
      const zipBlob = createZipBlob(Array.from(files.entries()).map(([relativePath, content]) => ({
        path: `${payload.spec.project.slug}/${relativePath}`,
        content,
      })));
      const zipBuffer = Buffer.from(await zipBlob.arrayBuffer());

      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${payload.spec.project.slug}.zip"`,
          'X-File-Count': String(files.size),
          'X-Request-Id': 'pw-remote-runbooks',
          'Access-Control-Allow-Origin': 'http://localhost:5173',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Expose-Headers': 'Content-Disposition, X-File-Count, X-Request-Id',
        },
        body: zipBuffer,
      });
    });

    await reachResultStep(page);
    await page.getByRole('button', { name: 'リポジトリ生成 (ZIP / remote)' }).click();
    await expect(page.getByText('request id: pw-remote-runbooks')).toBeVisible();
    await expect(page.getByRole('button', { name: 'ZIPをダウンロード' })).toBeEnabled();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'ZIPをダウンロード' }).click(),
    ]);

    const downloadPath = testInfo.outputPath(download.suggestedFilename());
    await download.saveAs(downloadPath);
    const zipBuffer = await readFile(downloadPath);
    const zipText = zipBuffer.toString('utf8');

    expect(capturedCredentials).toBeFalsy();
    expect(zipText).toContain('docs/runbooks/production-bootstrap.md');
    expect(zipText).toContain('docs/runbooks/production-cutover.md');
    expect(zipText).toContain('docs/runbooks/production-checks.md');
    expect(zipText).toContain('docs/runbooks/rollback.md');
    expect(zipText).toContain('docs/runbooks/incident-response.md');
    expect(zipText).toContain('.repogenesis/manifest.json');
  });

  test('リセットして始めからで intro step に戻る', async ({ page }) => {
    await enterPasteStep(page);
    await page.getByRole('button', { name: 'リセットして始めから' }).click();

    await expect(page.locator('.intro-section')).toBeVisible();
    await expect(page.getByRole('button', { name: '相談を始める' })).toBeVisible();
  });
});
