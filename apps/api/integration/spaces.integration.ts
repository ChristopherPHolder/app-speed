import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Clock, Effect, Layer, ManagedRuntime, Schema } from 'effect';
import { NodeHttpServer } from '@effect/platform-node';
import { HttpRouter } from 'effect/http';
import { HttpApi, HttpApiBuilder } from 'effect/http-api';
import { eq } from 'drizzle-orm';
import { ClerkIdentity, IdentityError } from '@app-speed/platform/auth-api';
import { AuditAccess, AuditGroupLive, RunnerLifecycle } from '@app-speed/audit/core/api-runtime';
import { AuditApiGroup } from '@app-speed/audit/core/api-contract';
import {
  AuditRepo,
  AuditRunIdSchema,
  AuditHistoryRepoLive,
  AuditRepoLive,
  DbClient,
  RecurringDispatch,
  RecordPersistenceLive,
  auditOccurrenceTable,
  auditRunTable,
  auditScheduleTable,
} from '@app-speed/audit/core/persistence';
import {
  UserFlowAuditRepo,
  SpaceAuditRepo,
  UserFlowAuditRepoLive,
  UserFlowAuditSchedulerLive,
} from '@app-speed/audit/user-flow/persistence';
import { ManagementOverviewSchema, UserFlowAuditApiGroup } from '@app-speed/audit/user-flow/api-contract';
import { UserFlowAuditDefinitionSchema } from '@app-speed/audit/user-flow/domain';
import { UserFlowAuditGroupLive } from '@app-speed/audit/user-flow/api-runtime';

const userA = `user_a_${crypto.randomUUID()}`;
const userB = `user_b_${crypto.randomUUID()}`;
const org = `org_${crypto.randomUUID()}`;
const deleted = new Set<string>();
const members = new Map([
  [userA, 'admin'],
  [userB, 'member'],
]);
const FakeIdentity = Layer.succeed(ClerkIdentity)({
  publishableKey: '',
  identify: (headers) => {
    const userId = headers['authorization']?.replace('Bearer ', '');
    return userId && [userA, userB].includes(userId)
      ? Effect.succeed({ userId, sessionId: 'verified-test-session' })
      : userId
        ? Effect.fail(new IdentityError({ message: 'Invalid session' }))
        : Effect.succeed(null);
  },
  authorize: (userId, spaceId) => {
    if (deleted.has(spaceId)) return Effect.fail(new IdentityError({ message: 'Deleted space' }));
    if (spaceId === `personal:${userId}`)
      return Effect.succeed({ id: spaceId, kind: 'personal', role: 'admin', userId });
    if (spaceId === `org:${org}` && members.has(userId))
      return Effect.succeed({
        id: spaceId,
        kind: 'organization',
        role: members.get(userId) === 'admin' ? 'admin' : 'member',
        userId,
      });
    return Effect.fail(new IdentityError({ message: 'Not a member' }));
  },
  exists: (id) => Effect.succeed(!deleted.has(id)),
});
const Base = Layer.mergeAll(
  DbClient.live,
  FakeIdentity,
  RecordPersistenceLive,
  Layer.succeed(RunnerLifecycle)({
    requestActivation: Effect.void,
    requestInactivationIfQueueEmpty: () => Effect.succeed({ shouldTerminate: false }),
  }),
);
const WithAccess = Layer.provideMerge(AuditAccess.live, Base);
const WithRepo = Layer.provideMerge(AuditRepoLive, WithAccess);
const WithHistory = Layer.provideMerge(AuditHistoryRepoLive, WithRepo);
const WithUserFlow = Layer.provideMerge(UserFlowAuditRepoLive, WithHistory);
const WithScheduling = Layer.provideMerge(UserFlowAuditSchedulerLive, WithUserFlow);
const Services = Layer.provideMerge(Layer.mergeAll(SpaceAuditRepo.live, RecurringDispatch.live), WithScheduling);
class TestApi extends HttpApi.make('api').add(UserFlowAuditApiGroup).add(AuditApiGroup).prefix('/api') {}
const App = HttpApiBuilder.layer(TestApi).pipe(
  Layer.provide([UserFlowAuditGroupLive, AuditGroupLive]),
  Layer.provideMerge(Services),
  Layer.provide(NodeHttpServer.layerHttpServices),
);
const memoMap = Layer.makeMemoMapUnsafe();
const app = HttpRouter.toWebHandler(App, { disableLogger: true, memoMap });
const runtime = ManagedRuntime.make(Services, { memoMap });
const browser = 'browser-a-000000000000000000000000000000000000000000';
const definition = {
  title: 'Private checkout',
  device: 'mobile',
  steps: [
    { type: 'customStep', step: 'startNavigation' },
    { type: 'navigate', url: 'https://example.com' },
    { type: 'customStep', step: 'endNavigation' },
  ],
};
const objectId = Schema.decodeUnknownSync(Schema.Struct({ templateId: Schema.String, versionId: Schema.String }));
const scheduleId = Schema.decodeUnknownSync(Schema.Struct({ scheduleId: Schema.String }));
const runId = Schema.decodeUnknownSync(Schema.Struct({ runId: Schema.String }));
const scheduled = Schema.decodeUnknownSync(
  Schema.Struct({ auditId: Schema.String, claimToken: Schema.NullOr(Schema.String) }),
);
const headers = (user?: string, space?: string) => ({
  'content-type': 'application/json',
  'x-guest-browser': browser,
  ...(user ? { authorization: `Bearer ${user}` } : {}),
  ...(space ? { 'x-audit-space': space } : {}),
});
const request = (path: string, user?: string, space?: string, body?: unknown) =>
  app.handler(
    new Request(`http://localhost/api${path}`, {
      method: body ? 'POST' : 'GET',
      headers: headers(user, space),
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),
  );
const manage = async (body: unknown, user = userA, space?: string) => {
  const response = await request('/audits/user-flow/manage', user, space, body);
  if (!response.ok) throw new Error(`Management failed: ${response.status}`);
  return response.json();
};
const at = <A, E, R>(time: number, effect: Effect.Effect<A, E, R>) =>
  Effect.gen(function* () {
    const clock = yield* Clock.Clock;
    return yield* effect.pipe(
      Effect.provideService(Clock.Clock, {
        currentTimeMillis: Effect.succeed(time),
        currentTimeMillisUnsafe: () => time,
        currentTimeNanos: Effect.succeed(BigInt(time) * 1_000_000n),
        currentTimeNanosUnsafe: () => BigInt(time) * 1_000_000n,
        monotonicTimeNanos: clock.monotonicTimeNanos,
        monotonicTimeNanosUnsafe: () => clock.monotonicTimeNanosUnsafe(),
        sleep: (duration) => clock.sleep(duration),
      }),
    );
  });
const tick = (time: number) =>
  runtime.runPromise(
    at(
      time,
      Effect.flatMap(RecurringDispatch, (d) => d.tick),
    ),
  );
const due = (id: string, time: number) =>
  runtime.runPromise(
    Effect.flatMap(DbClient, (db) =>
      db.run((c) =>
        c
          .update(auditScheduleTable)
          .set({ nextDueAt: new Date(time) })
          .where(eq(auditScheduleTable.id, id)),
      ),
    ),
  );
const occurrences = (id: string) =>
  runtime.runPromise(
    Effect.flatMap(DbClient, (db) =>
      db.run((c) => c.select().from(auditOccurrenceTable).where(eq(auditOccurrenceTable.scheduleId, id))),
    ),
  );
const recurrence = { kind: 'interval', minutes: 5 };

beforeAll(async () => {
  expect((await request('/audits/user-flow/manage', userA, undefined, { action: 'list' })).status).toBe(200);
});
afterAll(async () => {
  await app.dispose();
  await runtime.dispose();
});

describe('space isolation and capabilities through HTTP and PostgreSQL', () => {
  it('scopes history, definitions, results, reports and SSE even with known IDs', async () => {
    const saved = objectId(await manage({ action: 'save', definition }));
    const run = runId(await manage({ action: 'run', versionId: saved.versionId }));
    for (const suffix of ['', '/result', '/report', '/events']) {
      expect((await request(`/audits/user-flow/${run.runId}${suffix}`, userB)).status).toBe(404);
      expect((await request(`/audits/user-flow/${run.runId}${suffix}`)).status).toBe(404);
    }
    expect((await request(`/audits/user-flow/${run.runId}`, userA)).status).toBe(200);
    for (const path of ['/audits/history', '/audits/user-flow/history']) {
      const response = await request(path, userB);
      expect(await response.json()).toMatchObject({ items: [] });
      expect(await (await request(path)).json()).toMatchObject({ items: [] });
    }
    expect((await request('/audits/user-flow/manage', userB, `personal:${userA}`, { action: 'list' })).status).toBe(
      403,
    );
    expect(
      (await request('/audits/user-flow/manage', userB, undefined, { action: 'run', versionId: saved.versionId }))
        .status,
    ).toBe(400);
    expect((await request('/audits/user-flow/manage', 'forged-session', undefined, { action: 'list' })).status).toBe(
      401,
    );
  });
  it('requires the originating browser and claim credential; one concurrent claim wins', async () => {
    const guest = scheduled(
      await (await request('/audits/user-flow/schedule', undefined, undefined, definition)).json(),
    );
    expect(guest.claimToken).toBeTypeOf('string');
    expect((await request(`/audits/user-flow/${guest.auditId}`)).status).toBe(200);
    expect((await app.handler(new Request('http://localhost/api/audits/history'))).status).toBe(200);
    expect(await (await app.handler(new Request('http://localhost/api/audits/history'))).json()).toMatchObject({
      items: [],
    });
    expect(
      (
        await request('/audits/user-flow/manage', userA, undefined, {
          action: 'claim',
          runId: guest.auditId,
          claimToken: 'url-possession-is-not-authority',
        })
      ).status,
    ).toBe(400);
    const body = { action: 'claim', runId: guest.auditId, claimToken: guest.claimToken };
    const outcomes = await Promise.all([
      request('/audits/user-flow/manage', userA, undefined, body),
      request('/audits/user-flow/manage', userB, undefined, body),
    ]);
    expect(outcomes.filter((r) => r.ok)).toHaveLength(1);
    expect((await request(`/audits/user-flow/${guest.auditId}`)).status).toBe(404);
  });
  it('allows current organization members to view and run, but only creators/admins mutate', async () => {
    const space = `org:${org}`;
    const saved = objectId(await manage({ action: 'save', definition }, userA, space));
    expect(
      (
        await request('/audits/user-flow/manage', userB, space, {
          action: 'save',
          templateId: saved.templateId,
          definition,
        })
      ).status,
    ).toBe(400);
    const run = runId(await manage({ action: 'run', versionId: saved.versionId }, userB, space));
    expect((await request(`/audits/user-flow/${run.runId}`, userB)).status).toBe(200);
    members.delete(userB);
    expect((await request(`/audits/user-flow/${run.runId}`, userB)).status).toBe(404);
    expect((await request('/audits/user-flow/manage', userB, space, { action: 'list' })).status).toBe(403);
    members.set(userB, 'member');
  });
  it('shares exactly one run result/report and revokes subsequent access', async () => {
    const saved = objectId(await manage({ action: 'save', definition }));
    const run = runId(await manage({ action: 'run', versionId: saved.versionId }));
    // Persistence uses the same successful-completion path as the runner.
    await runtime.runPromise(
      Effect.flatMap(UserFlowAuditRepo, (repo) =>
        repo.completeSuccess(
          Schema.decodeUnknownSync(AuditRunIdSchema)(run.runId),
          { flowResult: { selectedRun: true }, reportHtml: '<html>private report</html>' },
          10,
        ),
      ),
    );
    const share = Schema.decodeUnknownSync(
      Schema.Struct({ shareToken: Schema.String, result: Schema.Struct({ shareId: Schema.String }) }),
    )(await manage({ action: 'share', runId: run.runId }));
    expect((await request(`/audits/user-flow/${run.runId}/result?share=${share.shareToken}`)).status).toBe(200);
    expect((await request(`/audits/user-flow/${run.runId}/report?share=${share.shareToken}`)).status).toBe(200);
    expect((await request(`/audits/user-flow/${run.runId}?share=${share.shareToken}`)).status).toBe(404);
    expect((await request(`/audits/user-flow/${run.runId}/events?share=${share.shareToken}`)).status).toBe(404);
    const other = runId(await manage({ action: 'run', versionId: saved.versionId }));
    expect((await request(`/audits/user-flow/${other.runId}/result?share=${share.shareToken}`)).status).toBe(404);
    await manage({ action: 'revokeShare', shareId: share.result.shareId });
    expect((await request(`/audits/user-flow/${run.runId}/report?share=${share.shareToken}`)).status).toBe(404);
  });
});

describe('durable schedule concurrency and lifecycle', () => {
  it('anchors create/resume/recurrence edits to the injected clock and preserves repin cadence', async () => {
    const scope = { id: `personal:${userA}`, kind: 'personal', role: 'admin', userId: userA } as const;
    const t = Date.parse('2027-01-01T00:00:00Z');
    const execute = (time: number, command: import('@app-speed/audit/user-flow/api-contract').AuditManagementCommand) =>
      runtime.runPromise(
        at(
          time,
          Effect.flatMap(SpaceAuditRepo, (repo) => repo.execute(command, scope)),
        ),
      );
    const saved = objectId(
      await execute(t, {
        action: 'save',
        definition: Schema.decodeUnknownSync(UserFlowAuditDefinitionSchema)(definition),
      }),
    );
    const scheduled = scheduleId(
      await execute(t, {
        action: 'createSchedule',
        versionId: saved.versionId,
        recurrence: { kind: 'interval', minutes: 5 },
      }),
    );
    const row = () =>
      runtime.runPromise(
        Effect.flatMap(DbClient, (db) =>
          db.run((c) => c.select().from(auditScheduleTable).where(eq(auditScheduleTable.id, scheduled.scheduleId))),
        ),
      );
    expect((await row())[0].nextDueAt.toISOString()).toBe('2027-01-01T00:05:00.000Z');
    await execute(t + 1_000, { action: 'updateSchedule', scheduleId: scheduled.scheduleId, state: 'paused' });
    await execute(t + 60_000, { action: 'updateSchedule', scheduleId: scheduled.scheduleId, state: 'active' });
    expect((await row())[0].nextDueAt.toISOString()).toBe('2027-01-01T00:06:00.000Z');
    await execute(t + 120_000, {
      action: 'updateSchedule',
      scheduleId: scheduled.scheduleId,
      versionId: saved.versionId,
    });
    expect((await row())[0].nextDueAt.toISOString()).toBe('2027-01-01T00:06:00.000Z');
    await execute(t + 180_000, {
      action: 'updateSchedule',
      scheduleId: scheduled.scheduleId,
      recurrence: { kind: 'weekly', time: '09:00', timezone: 'Europe/Vienna', weekday: 1 },
    });
    expect((await row())[0].nextDueAt.toISOString()).toBe('2027-01-04T08:00:00.000Z');
    await execute(t + 180_000, { action: 'updateSchedule', scheduleId: scheduled.scheduleId, state: 'deleted' });
    expect(
      Schema.decodeUnknownSync(ManagementOverviewSchema)(await manage({ action: 'list' })).schedules.some(
        (s) => s.id === scheduled.scheduleId && s.state === 'deleted',
      ),
    ).toBe(true);
    expect(await manage({ action: 'occurrences', scheduleId: scheduled.scheduleId })).toEqual([]);
  });
  it('records failures without retrying or disabling the schedule; deletion races stop future dispatch', async () => {
    const saved = objectId(await manage({ action: 'save', definition }));
    const schedule = scheduleId(await manage({ action: 'createSchedule', versionId: saved.versionId, recurrence }));
    const now = Date.now();
    await due(schedule.scheduleId, now);
    await tick(now);
    const dispatched = (await occurrences(schedule.scheduleId))[0];
    expect(dispatched.runId).toBeTypeOf('string');
    await runtime.runPromise(
      Effect.flatMap(AuditRepo, (repo) =>
        repo.completeFailure(
          Schema.decodeUnknownSync(AuditRunIdSchema)(dispatched.runId),
          { message: 'Expected failure' },
          1,
        ),
      ),
    );
    await tick(now);
    expect(await occurrences(schedule.scheduleId)).toHaveLength(1);
    await tick(now + 300_000);
    expect(await occurrences(schedule.scheduleId)).toHaveLength(2);
    await Promise.all([
      tick(now + 600_000),
      manage({ action: 'updateSchedule', scheduleId: schedule.scheduleId, state: 'deleted' }),
    ]);
    const count = (await occurrences(schedule.scheduleId)).length;
    await tick(now + 900_000);
    expect(await occurrences(schedule.scheduleId)).toHaveLength(count);
  });
  it('dispatches once across competing ticks and skips queued/running overlaps without losing cadence', async () => {
    const saved = objectId(await manage({ action: 'save', definition }));
    const schedule = scheduleId(await manage({ action: 'createSchedule', versionId: saved.versionId, recurrence }));
    const now = Date.now();
    await due(schedule.scheduleId, now);
    await Promise.all([tick(now), tick(now)]);
    let rows = await occurrences(schedule.scheduleId);
    expect(rows).toHaveLength(1);
    expect(rows[0].outcome).toBe('dispatched');
    await tick(now + 300_000);
    rows = await occurrences(schedule.scheduleId);
    expect(rows.map((r) => r.outcome).sort()).toEqual(['dispatched', 'overlap']);
    await runtime.runPromise(
      Effect.flatMap(DbClient, (db) =>
        db.run((c) =>
          c
            .update(auditRunTable)
            .set({ status: 'IN_PROGRESS' })
            .where(eq(auditRunTable.scheduleId, schedule.scheduleId)),
        ),
      ),
    );
    await tick(now + 600_000);
    expect((await occurrences(schedule.scheduleId)).filter((r) => r.outcome === 'overlap')).toHaveLength(2);
    await manage({ action: 'updateSchedule', scheduleId: schedule.scheduleId, state: 'deleted' });
  });
  it('records downtime as a range, restarts idempotently, and resumes in the future', async () => {
    const saved = objectId(await manage({ action: 'save', definition }));
    const schedule = scheduleId(await manage({ action: 'createSchedule', versionId: saved.versionId, recurrence }));
    const now = Date.now();
    await due(schedule.scheduleId, now - 3_600_000);
    await tick(now);
    await tick(now);
    const rows = await occurrences(schedule.scheduleId);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ outcome: 'missed', count: 13, runId: null });
    await manage({ action: 'updateSchedule', scheduleId: schedule.scheduleId, state: 'paused' });
    await tick(now + 7_200_000);
    expect(await occurrences(schedule.scheduleId)).toHaveLength(1);
    await manage({ action: 'updateSchedule', scheduleId: schedule.scheduleId, state: 'active' });
    const next = await runtime.runPromise(
      Effect.flatMap(DbClient, (db) =>
        db.run((c) => c.select().from(auditScheduleTable).where(eq(auditScheduleTable.id, schedule.scheduleId))),
      ),
    );
    expect(next[0].nextDueAt.getTime()).toBeGreaterThan(Date.now());
    await manage({ action: 'updateSchedule', scheduleId: schedule.scheduleId, state: 'deleted' });
  });
  it('pins immutable versions, preserves cadence on repinning, and races safely with edits/pause', async () => {
    const saved = objectId(await manage({ action: 'save', definition }));
    const schedule = scheduleId(await manage({ action: 'createSchedule', versionId: saved.versionId, recurrence }));
    const now = Date.now();
    await due(schedule.scheduleId, now);
    const newer = objectId(
      await manage({
        action: 'save',
        templateId: saved.templateId,
        definition: { ...definition, title: 'Updated checkout' },
      }),
    );
    await tick(now);
    expect((await occurrences(schedule.scheduleId))[0].versionId).toBe(saved.versionId);
    await manage({ action: 'updateSchedule', scheduleId: schedule.scheduleId, versionId: newer.versionId });
    const dbSchedule = () =>
      runtime.runPromise(
        Effect.flatMap(DbClient, (db) =>
          db.run((c) => c.select().from(auditScheduleTable).where(eq(auditScheduleTable.id, schedule.scheduleId))),
        ),
      );
    expect((await dbSchedule())[0].nextDueAt.getTime()).toBe(now + 300_000);
    await Promise.all([
      tick(now + 300_000),
      manage({ action: 'updateSchedule', scheduleId: schedule.scheduleId, state: 'paused' }),
    ]);
    expect((await dbSchedule())[0].state).toBe('paused');
    const count = (await occurrences(schedule.scheduleId)).length;
    await tick(now + 600_000);
    expect(await occurrences(schedule.scheduleId)).toHaveLength(count);
    await manage({
      action: 'updateSchedule',
      scheduleId: schedule.scheduleId,
      recurrence: { kind: 'interval', minutes: 30 },
      state: 'active',
    });
    expect((await dbSchedule())[0].nextDueAt.getTime()).toBeGreaterThan(Date.now() + 29 * 60_000);
    await manage({ action: 'updateSchedule', scheduleId: schedule.scheduleId, state: 'deleted' });
  });
  it('enforces personal and organization limits atomically; paused slots can be resumed only within quota', async () => {
    for (const space of [`personal:${userA}`, `org:${org}`]) {
      const saved = objectId(await manage({ action: 'save', definition }, userA, space));
      const attempts = await Promise.allSettled(
        Array.from({ length: 11 }, () =>
          manage({ action: 'createSchedule', versionId: saved.versionId, recurrence }, userA, space),
        ),
      );
      const successes = attempts.filter((a) => a.status === 'fulfilled');
      expect(successes).toHaveLength(10);
      const ids = successes.map((s) => scheduleId(s.value).scheduleId);
      await manage({ action: 'updateSchedule', scheduleId: ids[0], state: 'paused' }, userA, space);
      const extra = scheduleId(
        await manage({ action: 'createSchedule', versionId: saved.versionId, recurrence }, userA, space),
      );
      expect(
        (
          await request('/audits/user-flow/manage', userA, space, {
            action: 'updateSchedule',
            scheduleId: ids[0],
            state: 'active',
          })
        ).status,
      ).toBe(400);
      for (const id of [...ids, extra.scheduleId])
        await manage({ action: 'updateSchedule', scheduleId: id, state: 'deleted' }, userA, space);
    }
  });
  it('keeps organization schedules after creator departure, permits admin reassignment, and stops deleted spaces', async () => {
    const space = `org:${org}`;
    const saved = objectId(await manage({ action: 'save', definition }, userB, space));
    const schedule = scheduleId(
      await manage({ action: 'createSchedule', versionId: saved.versionId, recurrence }, userB, space),
    );
    members.delete(userB);
    const now = Date.now();
    await due(schedule.scheduleId, now);
    await tick(now);
    expect((await occurrences(schedule.scheduleId))[0].outcome).toBe('dispatched');
    await manage({ action: 'updateSchedule', scheduleId: schedule.scheduleId, createdBy: userA }, userA, space);
    deleted.add(space);
    await tick(now + 300_000);
    const rows = await runtime.runPromise(
      Effect.flatMap(DbClient, (db) =>
        db.run((c) => c.select().from(auditScheduleTable).where(eq(auditScheduleTable.id, schedule.scheduleId))),
      ),
    );
    expect(rows[0].state).toBe('deleted');
    expect(await occurrences(schedule.scheduleId)).toHaveLength(1);
  });
});
