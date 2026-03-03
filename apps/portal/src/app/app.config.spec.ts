import { appConfig } from './app.config';

describe('appConfig', () => {
  it('should provide app-level providers', () => {
    expect(appConfig.providers?.length ?? 0).toBeGreaterThan(0);
  });
});
