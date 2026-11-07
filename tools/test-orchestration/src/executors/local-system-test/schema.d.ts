export interface LocalSystemTestExecutorSchema {
  suite: 'integration' | 'e2e';
  testTarget: string;
  clerk?: boolean;
  updateSnapshots?: boolean;
  timeoutMs?: number;
  apiPort?: number;
  portalPort?: number;
  fixturePort?: number;
}
