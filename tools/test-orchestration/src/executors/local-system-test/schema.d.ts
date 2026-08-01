export interface LocalSystemTestExecutorSchema {
  suite: 'integration' | 'e2e';
  testTarget: string;
  timeoutMs?: number;
  apiPort?: number;
  portalPort?: number;
  fixturePort?: number;
  databaseEnvironmentVariable?: string;
}
