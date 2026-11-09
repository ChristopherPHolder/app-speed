import { describe, it, expect } from '@effect/vitest';
import { ConfigProvider, Effect, Schema } from 'effect';
import { WorkspaceStore, WorkspaceStoreLive } from './store';

describe('optional workspace storage', () => {
  it.effect.each([{}, { DATABASE_URL: '' }])(
    'starts without Postgres and fails workspace requests explicitly (%j)',
    (env) =>
      Effect.gen(function* () {
        const store = yield* WorkspaceStore;
        const failure = yield* store.transaction((sql) => sql(Schema.Unknown, 'SELECT 1')).pipe(Effect.flip);
        expect(failure._tag).toBe('WorkspaceUnavailable');
        expect(failure.message).toContain('not configured');
      }).pipe(
        Effect.provide(WorkspaceStoreLive),
        Effect.provideService(ConfigProvider.ConfigProvider, ConfigProvider.fromEnv({ env })),
      ),
  );
});
