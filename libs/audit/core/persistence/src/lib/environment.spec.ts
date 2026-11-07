import { ConfigProvider, Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { productionStorage } from './environment';

describe('storage environment', () => {
  it('fails closed for invalid production overrides', async () => {
    const exit = await Effect.runPromiseExit(
      productionStorage.pipe(
        Effect.provideService(
          ConfigProvider.ConfigProvider,
          ConfigProvider.fromUnknown({ NODE_ENV: 'production', APP_ENV: 'production ' }),
        ),
      ),
    );
    expect(exit._tag).toBe('Failure');
  });
  it.each([
    [{}, false],
    [{ NODE_ENV: 'test' }, false],
    [{ NODE_ENV: 'production' }, true],
    [{ NODE_ENV: 'production', APP_ENV: 'development' }, false],
    [{ NODE_ENV: 'production', APP_ENV: 'test' }, false],
    [{ APP_ENV: 'production' }, true],
    [{ APP_ENV: 'prod' }, true],
  ])('selects production storage for %j: %s', async (values, expected) => {
    expect(
      await Effect.runPromise(
        productionStorage.pipe(
          Effect.provideService(ConfigProvider.ConfigProvider, ConfigProvider.fromUnknown(values)),
        ),
      ),
    ).toBe(expected);
  });
});
