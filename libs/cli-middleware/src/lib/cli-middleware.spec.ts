import { cliMiddleware } from './cli-middleware';

describe('cliMiddleware', () => {
  it('should work', () => {
    expect(cliMiddleware()).toEqual('cli-middleware');
  });
});
