import type { FormState } from '../state/actions';
import { isValidSlug } from './slugify.ts';

/**
 * 全フィールドのバリデーション。エラーを Record<string, string> で返す。
 * キーはフィールドパス（例: "project.name"）、値はエラーメッセージ。
 * 空オブジェクト = バリデーション通過。
 */
export function validate(state: FormState): Record<string, string> {
  const errors: Record<string, string> = {};

  // Project
  if (!state.project.name.trim()) {
    errors['project.name'] = 'プロジェクト名は必須です';
  }
  if (!state.project.slug.trim()) {
    errors['project.slug'] = 'スラッグは必須です';
  } else if (!isValidSlug(state.project.slug)) {
    errors['project.slug'] = 'スラッグは英小文字・数字・ハイフンのみ（先頭は英数字）';
  }
  if (!state.project.description.trim()) {
    errors['project.description'] = '概要は必須です';
  } else if (state.project.description.trim().length < 10) {
    errors['project.description'] = '概要は10文字以上で入力してください';
  }
  // Tech
  if (state.tech.ai_tools.length === 0) {
    errors['tech.ai_tools'] = 'AI開発ツールを1つ以上選択してください';
  }

  // Security — level is auto-calculated, no user validation needed

  // Structure
  if (state.structure.repo_type === 'multi') {
    if (state.structure.repos.length === 0) {
      errors['structure.repos'] = 'マルチリポジトリ構成では1つ以上のリポジトリが必要です';
    }

    const nameCount = new Map<string, number>();
    const repoNames = new Set<string>();

    state.structure.repos.forEach((repo, index) => {
      const prefix = `structure.repos[${index}]`;

      if (!repo.name.trim()) {
        errors[`${prefix}.name`] = 'リポジトリ名は必須です';
      } else if (!isValidSlug(repo.name)) {
        errors[`${prefix}.name`] = 'リポジトリ名はslug形式（英小文字・数字・ハイフン）';
      } else {
        repoNames.add(repo.name);
        nameCount.set(repo.name, (nameCount.get(repo.name) || 0) + 1);
      }

      if (!repo.description.trim()) {
        errors[`${prefix}.description`] = 'リポジトリの説明は必須です';
      }
      if (!repo.owner.trim()) {
        errors[`${prefix}.owner`] = 'リポジトリの責任者は必須です';
      }
    });

    // Name uniqueness check
    nameCount.forEach((count, name) => {
      if (count > 1) {
        state.structure.repos.forEach((repo, index) => {
          if (repo.name === name) {
            errors[`structure.repos[${index}].name`] = `リポジトリ名「${name}」が重複しています`;
          }
        });
      }
    });

    // depends_on validation
    state.structure.repos.forEach((repo, index) => {
      const prefix = `structure.repos[${index}]`;
      for (const dep of repo.depends_on) {
        if (dep === repo.name) {
          errors[`${prefix}.depends_on`] = '自己参照はできません';
          break;
        }
        if (!repoNames.has(dep)) {
          errors[`${prefix}.depends_on`] = `依存先「${dep}」は存在しません`;
          break;
        }
      }
    });
  }

  // Workflow
  if (state.workflow.phases_count < 1 || state.workflow.phases_count > 10) {
    errors['workflow.phases_count'] = 'フェーズ数は1〜10の範囲で入力してください';
  }

  return errors;
}
