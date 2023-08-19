import { local } from './local';

describe('localStore', () => {
  it('should work', () => {
    expect(local()).toEqual('local-store');
  });
});
