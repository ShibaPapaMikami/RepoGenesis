import { getSupportDataStoreStatus } from './supportDataStore';

export interface HealthPayload {
  ok: true;
  supportData: {
    absolutePath: string;
    relativePath: string;
    directoryPath: string;
    configuredPath: string | null;
    usingDefaultPath: boolean;
    exists: boolean;
  };
}

export function buildHealthPayload(): HealthPayload {
  const supportData = getSupportDataStoreStatus();
  return {
    ok: true,
    supportData: {
      absolutePath: supportData.absolutePath,
      relativePath: supportData.relativePath,
      directoryPath: supportData.directoryPath,
      configuredPath: supportData.configuredPath,
      usingDefaultPath: supportData.usingDefaultPath,
      exists: supportData.exists,
    },
  };
}
