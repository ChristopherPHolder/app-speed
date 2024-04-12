import { LocalStore } from './local';

describe.skip('localStore', () => {
  it('should work without config', () => {
    const localStore = new LocalStore();
    const stored = localStore.store('' as any);

    expect(stored).toBeTruthy();
    // expect file to be persisted
  });


  it('should work with config', () => {
    const localStore = new LocalStore();
    const stored = localStore.store('' as any);

    expect(stored).toBeTruthy();
    // expect file to be persisted
  });
});
