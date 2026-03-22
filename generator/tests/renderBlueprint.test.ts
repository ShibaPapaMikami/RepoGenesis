import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';

const renderYamlPath = path.resolve(__dirname, '..', '..', 'render.yaml');
const generatorPackageJsonPath = path.resolve(__dirname, '..', 'package.json');

function extractValue(source: string, key: string): string | null {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`^\\s*${escapedKey}:\\s*(.+)$`, 'm'));
  return match ? match[1].trim() : null;
}

describe('render blueprint baseline', () => {
  it('pins the orchestration api service contract', () => {
    const source = fs.readFileSync(renderYamlPath, 'utf8');

    expect(source).toContain('name: repogenesis-orchestration-api');
    expect(source).toContain('rootDir: generator');
    expect(source).toContain('buildCommand: npm install && npm run build');
    expect(source).toContain('startCommand: npm run start:api');
    expect(source).toContain('healthCheckPath: /healthz');
    expect(source).toContain('mountPath: /var/data/repogenesis');
    expect(source).toContain('value: /var/data/repogenesis/support-data.sqlite');
    expect(source).toContain('key: NEXTAUTH_SECRET');
    expect(source).toContain('key: CORS_ALLOW_ORIGIN');
  });

  it('keeps NODE_VERSION aligned with the generator engine floor', () => {
    const renderYaml = fs.readFileSync(renderYamlPath, 'utf8');
    const packageJson = JSON.parse(fs.readFileSync(generatorPackageJsonPath, 'utf8')) as {
      engines?: { node?: string };
    };

    const nodeVersion = extractValue(renderYaml, 'value');
    const engineFloor = packageJson.engines?.node;

    expect(engineFloor).toBe('>=22.17.0');
    expect(renderYaml).toContain('key: NODE_VERSION');
    expect(nodeVersion).toBe('22.17.0');
  });

  it('declares the support store path on the durable disk', () => {
    const source = fs.readFileSync(renderYamlPath, 'utf8');
    const diskMount = extractValue(source, 'mountPath');
    const supportPathMatch = source.match(/key:\s+SUPPORT_DATA_DB_PATH\s+value:\s+(.+)/m);
    const supportPath = supportPathMatch ? supportPathMatch[1].trim() : null;

    expect(diskMount).toBe('/var/data/repogenesis');
    expect(supportPath).toBe('/var/data/repogenesis/support-data.sqlite');
    expect(supportPath?.startsWith(`${diskMount}/`)).toBe(true);
  });
});
