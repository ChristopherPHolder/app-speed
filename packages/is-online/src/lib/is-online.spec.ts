import { isOnline } from './is-online';

describe('isOnline', () => {
  it('should work', () => {
    expect(isOnline()).toEqual('is-online');
  });
});
