import { describe, expect, it } from '@effect/vitest';
import { Chunk, Deferred, Effect, Fiber, Stream } from 'effect';
import { AuditQueue, AuditQueueLive } from './AuditQueue';
import { AuditIdType } from './Audit';

describe('AuditQueue', () => {
  it.effect('should be fifo queue', () => {
    return Effect.gen(function* () {
      const auditIdOne = asAuditId('1');
      const auditIdTwo = asAuditId('2');

      const queue = yield* AuditQueue;
      yield* queue.enqueue(auditIdOne);
      yield* queue.enqueue(auditIdTwo);
      const dequeuedOne = yield* queue.dequeue;
      const dequeuedTwo = yield* queue.dequeue;

      expect(dequeuedOne).toBe(auditIdOne);
      expect(dequeuedTwo).toBe(auditIdTwo);
    }).pipe(Effect.provide(AuditQueueLive));
  });

  it.effect('should block when dequeue until something is enqueued', () => {
    return Effect.gen(function* () {
      const queue = yield* AuditQueue;

      const fiber = yield* Effect.fork(queue.dequeue);

      const status1 = yield* Fiber.status(fiber);
      expect(status1._tag).toBe('Running');

      yield* Effect.yieldNow();

      const status2 = yield* Fiber.status(fiber);
      expect(status2._tag).toBe('Suspended');

      const id = asAuditId('1');
      yield* queue.enqueue(id);
      const status3 = yield* Fiber.status(fiber);
      expect(status3._tag).toBe('Running');

      const got = yield* Fiber.join(fiber);
      expect(got).toBe(id);

      const status4 = yield* Fiber.status(fiber);
      expect(status4._tag).toBe('Done');
    }).pipe(Effect.provide(AuditQueueLive));
  });

  it.effect('should emit on dequeue', () => {
    return Effect.gen(function* () {
      const queue = yield* AuditQueue;

      const a1 = asAuditId('1');
      const a2 = asAuditId('2');
      const a3 = asAuditId('3');

      yield* queue.enqueue(a1);
      yield* queue.enqueue(a2);
      yield* queue.enqueue(a3);

      const started = yield* Deferred.make<void>();

      const stream = queue.watch(a2).pipe(Stream.tap(() => Deferred.succeed(started, void 0)));

      const fiber = yield* Effect.fork(Stream.runCollect(stream).pipe(Effect.map(Chunk.toReadonlyArray)));

      yield* Deferred.await(started);

      yield* queue.dequeue;
      yield* queue.dequeue;

      const events = yield* Fiber.join(fiber);
      expect(events).toEqual([1, 0]);
    }).pipe(Effect.provide(AuditQueueLive));
  });
});

const asAuditId = (id: string) => id as AuditIdType;
