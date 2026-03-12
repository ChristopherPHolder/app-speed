import { Clock, Context, Effect, Layer, Schema, SynchronizedRef } from 'effect';

import { RunnerIdSchema, type ActiveRunnerList } from './RunnerManager.js';

export type RunnerHeartbeatState = 'BUSY' | 'IDLE';

type RunnerRecord = {
  lastHeartbeatAt: Date;
  lastActivityAt: Date;
  idleSince: Date | null;
};

const toRunnerId = (value: string) => Schema.decodeSync(RunnerIdSchema)(value);

const resolveTimestamp = (nowMs: number, explicitTimestamp: number | undefined): number =>
  explicitTimestamp !== undefined ? explicitTimestamp : nowMs;

const updateRecord = (
  existing: RunnerRecord | undefined,
  timestampMs: number,
  update: Partial<RunnerRecord>,
): RunnerRecord => ({
  lastHeartbeatAt: existing?.lastHeartbeatAt ?? new Date(timestampMs),
  lastActivityAt: existing?.lastActivityAt ?? new Date(timestampMs),
  idleSince: existing?.idleSince ?? null,
  ...update,
});

export class RunnerRegistry extends Context.Tag('RunnerRegistry')<
  RunnerRegistry,
  {
    recordClaimResult: (runnerId: string, available: boolean, timestamp?: number) => Effect.Effect<void, never>;
    recordCompletion: (runnerId: string, timestamp?: number) => Effect.Effect<void, never>;
    recordHeartbeat: (
      runnerId: string,
      payload: {
        timestamp?: number;
        state?: RunnerHeartbeatState;
        idleSince?: number;
      },
    ) => Effect.Effect<void, never>;
    listActiveRunners: (runnerIds: ReadonlyArray<string>) => Effect.Effect<ActiveRunnerList, never>;
    listIdleRunnerIds: (
      runnerIds: ReadonlyArray<string>,
      idleTimeoutMs: number,
    ) => Effect.Effect<ReadonlyArray<string>, never>;
    markTerminated: (runnerId: string) => Effect.Effect<void, never>;
    pruneInactiveRunners: (runnerIds: ReadonlyArray<string>) => Effect.Effect<void, never>;
  }
>() {}

export const RunnerRegistryLive = Layer.scoped(
  RunnerRegistry,
  Effect.gen(function* () {
    const stateRef = yield* SynchronizedRef.make(new Map<string, RunnerRecord>());

    const recordClaimResult = (runnerId: string, available: boolean, timestamp?: number) =>
      Effect.gen(function* () {
        const nowMs = yield* Clock.currentTimeMillis;
        const observedAtMs = resolveTimestamp(nowMs, timestamp);

        yield* SynchronizedRef.update(stateRef, (state) => {
          const next = new Map(state);
          const existing = next.get(runnerId);
          next.set(
            runnerId,
            available
              ? updateRecord(existing, observedAtMs, {
                  lastHeartbeatAt: new Date(observedAtMs),
                  lastActivityAt: new Date(observedAtMs),
                  idleSince: null,
                })
              : updateRecord(existing, observedAtMs, {
                  lastHeartbeatAt: new Date(observedAtMs),
                  idleSince: existing?.idleSince ?? new Date(observedAtMs),
                }),
          );
          return next;
        });
      });

    const recordCompletion = (runnerId: string, timestamp?: number) =>
      Effect.gen(function* () {
        const nowMs = yield* Clock.currentTimeMillis;
        const observedAtMs = resolveTimestamp(nowMs, timestamp);

        yield* SynchronizedRef.update(stateRef, (state) => {
          const next = new Map(state);
          const existing = next.get(runnerId);
          next.set(
            runnerId,
            updateRecord(existing, observedAtMs, {
              lastHeartbeatAt: new Date(observedAtMs),
              lastActivityAt: new Date(observedAtMs),
              idleSince: null,
            }),
          );
          return next;
        });
      });

    const recordHeartbeat = (
      runnerId: string,
      payload: {
        timestamp?: number;
        state?: RunnerHeartbeatState;
        idleSince?: number;
      },
    ) =>
      Effect.gen(function* () {
        const nowMs = yield* Clock.currentTimeMillis;
        const heartbeatAtMs = resolveTimestamp(nowMs, payload.timestamp);

        yield* SynchronizedRef.update(stateRef, (state) => {
          const next = new Map(state);
          const existing = next.get(runnerId);
          const nextRecord = updateRecord(existing, heartbeatAtMs, {
            lastHeartbeatAt: new Date(heartbeatAtMs),
          });

          if (payload.state === 'BUSY') {
            nextRecord.lastActivityAt = new Date(heartbeatAtMs);
            nextRecord.idleSince = null;
          }

          if (payload.state === 'IDLE') {
            const idleSinceMs = payload.idleSince ?? nextRecord.idleSince?.getTime() ?? heartbeatAtMs;
            nextRecord.idleSince = new Date(idleSinceMs);
          }

          next.set(runnerId, nextRecord);
          return next;
        });
      });

    const listActiveRunners = (runnerIds: ReadonlyArray<string>) =>
      Effect.gen(function* () {
        const nowMs = yield* Clock.currentTimeMillis;
        const records = yield* SynchronizedRef.get(stateRef);
        return runnerIds.map((runnerId) => ({
          id: toRunnerId(runnerId),
          lastHeartbeatAt: records.get(runnerId)?.lastHeartbeatAt ?? new Date(nowMs),
        })) satisfies ActiveRunnerList;
      });

    const listIdleRunnerIds = (runnerIds: ReadonlyArray<string>, idleTimeoutMs: number) =>
      Effect.gen(function* () {
        const nowMs = yield* Clock.currentTimeMillis;
        const records = yield* SynchronizedRef.get(stateRef);
        return runnerIds.filter((runnerId) => {
          const idleSince = records.get(runnerId)?.idleSince;
          return idleSince !== null && idleSince !== undefined && nowMs - idleSince.getTime() >= idleTimeoutMs;
        });
      });

    const markTerminated = (runnerId: string) =>
      SynchronizedRef.update(stateRef, (state) => {
        const next = new Map(state);
        next.delete(runnerId);
        return next;
      });

    const pruneInactiveRunners = (runnerIds: ReadonlyArray<string>) =>
      SynchronizedRef.update(stateRef, (state) => {
        const activeIds = new Set(runnerIds);
        const next = new Map(state);
        for (const runnerId of next.keys()) {
          if (!activeIds.has(runnerId)) {
            next.delete(runnerId);
          }
        }
        return next;
      });

    return {
      recordClaimResult,
      recordCompletion,
      recordHeartbeat,
      listActiveRunners,
      listIdleRunnerIds,
      markTerminated,
      pruneInactiveRunners,
    };
  }),
);
