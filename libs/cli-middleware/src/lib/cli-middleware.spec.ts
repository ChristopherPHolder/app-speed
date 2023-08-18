import { cliMiddleware } from './cli-middleware';

describe('cliMiddleware', () => {
  it('should work', async () => {
    const t = await import('./mock.mjs' as any);
    expect(t.default).toEqual({});
  });
});
