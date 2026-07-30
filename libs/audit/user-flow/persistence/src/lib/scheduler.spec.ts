import { getTableName } from 'drizzle-orm';
import { Effect, Layer } from 'effect';
import { describe, expect, it } from 'vitest';

import { DbClient, QueryError } from '@app-speed/audit/core/persistence';

import { UserFlowAuditScheduler, UserFlowAuditSchedulerLive } from './scheduler';

const definition = {
  title: 'Checkout',
  device: 'mobile',
  steps: [
    { type: 'customStep', step: 'startNavigation' },
    { type: 'navigate', url: 'https://example.com' },
    { type: 'customStep', step: 'endNavigation' },
  ],
} as const;

describe('UserFlowAuditScheduler', () => {
  it('inserts the shared template, user-flow definition, and run in one transaction', async () => {
    const inserts: Array<{ table: string; values: Record<string, unknown> }> = [];
    let transactionCount = 0;
    const client = {
      transaction: async (
        useTransaction: (transaction: {
          insert: (table: Parameters<typeof getTableName>[0]) => {
            values: (values: Record<string, unknown>) => Promise<void>;
          };
        }) => Promise<void>,
      ) => {
        transactionCount += 1;
        await useTransaction({
          insert: (table) => ({
            values: async (values) => {
              inserts.push({ table: getTableName(table), values });
            },
          }),
        });
      },
    };
    const DbClientTest = Layer.succeed(DbClient, {
      run: (operation) =>
        Effect.tryPromise({
          try: () => Promise.resolve(operation(client as never)),
          catch: (cause) => new QueryError({ message: 'test database failure', cause }),
        }),
    });

    const auditId = await Effect.runPromise(
      Effect.gen(function* () {
        const scheduler = yield* UserFlowAuditScheduler;
        return yield* scheduler.schedule(definition);
      }).pipe(Effect.provide(UserFlowAuditSchedulerLive), Effect.provide(DbClientTest)),
    );

    expect(auditId).toBeTypeOf('string');
    expect(transactionCount).toBe(1);
    expect(inserts.map(({ table }) => table)).toEqual([
      'audit_templates',
      'user_flow_audit_templates',
      'audit_runs',
    ]);
    expect(inserts[0].values).toMatchObject({ kind: 'user-flow' });
    expect(inserts[1].values).toMatchObject({ definition });
    expect(inserts[2].values).toMatchObject({ status: 'SCHEDULED' });
  });
});
