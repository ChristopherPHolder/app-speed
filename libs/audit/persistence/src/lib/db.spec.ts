import { ConfigProvider, Effect } from 'effect';
import { describe, expect, it } from 'vitest';

import { DbClient } from './db';

describe('DbClient', () => {
  it('fails clearly when DATABASE_URL is missing', async () => {
    const exit = await Effect.runPromiseExit(
      Effect.scoped(
        Effect.gen(function* () {
          yield* DbClient;
        }),
      ).pipe(Effect.provide(DbClient.live), Effect.withConfigProvider(ConfigProvider.fromMap(new Map()))),
    );

    expect(exit._tag).toBe('Failure');
    expect(exit.toString()).toContain('DATABASE_URL');
  });
});
