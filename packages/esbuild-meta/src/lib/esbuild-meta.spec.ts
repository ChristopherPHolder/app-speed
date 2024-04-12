import { esbuildMeta } from './esbuild-meta';

describe('esbuildMeta', () => {
  it('should work', () => {
    expect(esbuildMeta()).toEqual('esbuild-meta');
  });
});
