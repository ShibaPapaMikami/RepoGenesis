export function readRuntimeEnv(key: string): string | undefined {
  const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  const viteValue = viteEnv?.[key];
  if (typeof viteValue === 'string' && viteValue.length > 0) {
    return viteValue;
  }

  const processEnv = (globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  }).process?.env;
  if (processEnv && typeof processEnv[key] === 'string') {
    const processValue = processEnv[key];
    if (processValue && processValue.length > 0) {
      return processValue;
    }
  }

  return undefined;
}
