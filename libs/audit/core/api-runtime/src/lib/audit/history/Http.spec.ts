import { it, expect } from '@effect/vitest';
import { Effect } from 'effect';
import { AuditHistoryRepo } from '@app-speed/audit/core/persistence';
import { AuditAccess } from '../access';
import { historyHandler } from './Http';

it.effect('normalizes search and passes outcome to the paginated repository', () =>
  historyHandler('user-flow')({ query: { search: '  Mixed Title  ', outcome: 'FAILURE', limit: '1' } }).pipe(
    Effect.provideService(AuditAccess, {
      current: Effect.succeed({ identity: null, browserHash: 'browser-hash', spaceId: null }),
      space: Effect.die('Guest has no space'),
      run: () => Effect.void,
    }),
    Effect.provideService(AuditHistoryRepo, {
      listRunsPage: (params) => {
        expect(params).toEqual({
          spaceId: undefined,
          browserHash: 'browser-hash',
          search: 'Mixed Title',
          outcome: 'FAILURE',
          limit: 1,
          cursor: null,
          status: null,
          kind: 'user-flow',
        });
        return Effect.succeed({ items: [], nextCursor: null });
      },
    }),
    Effect.tap((page) => Effect.sync(() => expect(page).toEqual({ items: [], nextCursor: null, limit: 1 }))),
  ),
);

for (const query of [{ outcome: 'PENDING' }, { search: 'x'.repeat(201) }]) {
  it.effect('rejects unsupported history filters: ' + Object.keys(query)[0], () =>
    historyHandler('user-flow')({ query }).pipe(
      Effect.provideService(AuditAccess, {
        current: Effect.succeed({ identity: null, browserHash: 'browser-hash', spaceId: null }),
        space: Effect.die('Guest has no space'),
        run: () => Effect.void,
      }),
      Effect.provideService(AuditHistoryRepo, {
        listRunsPage: () => Effect.die('Invalid filters must not query the database'),
      }),
      Effect.flip,
      Effect.tap((error) => Effect.sync(() => expect(error._tag).toBe('AuditHistoryInvalidQueryError'))),
    ),
  );
}
