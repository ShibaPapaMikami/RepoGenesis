import * as fs from 'fs';
import * as path from 'path';
import { resolvePathWithin } from './pathSafety';

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

/**
 * ファイルを書き出す。ディレクトリがなければ自動作成。
 * UTF-8、LF改行を強制。
 */
export function writeFile(basePath: string, relativePath: string, content: string): void {
  const fullPath = resolvePathWithin(basePath, relativePath, 'generated file path');
  const dir = path.dirname(fullPath);
  ensureDir(dir);

  // LF改行を強制（CRLFがあればLFに変換）
  const lfContent = content.replace(/\r\n/g, '\n');
  fs.writeFileSync(fullPath, lfContent, { encoding: 'utf-8' });
}
