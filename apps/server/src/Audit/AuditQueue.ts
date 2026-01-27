import { Context, Effect, Layer, PubSub, Queue, Ref, Stream } from 'effect';
import { AuditIdType } from './Audit';

export class AuditQueue extends Context.Tag('AuditQueue')<
  AuditQueue,
  {
    readonly enqueue: (id: AuditIdType) => Effect.Effect<void>;
    readonly dequeue: Effect.Effect<AuditIdType>;
    readonly watch: (id: AuditIdType) => Stream.Stream<number>;
  }
>() {}

export const AuditQueueLive = Layer.effect(
  AuditQueue,
  Effect.gen(function* () {
    const workQueue = yield* Queue.unbounded<AuditIdType>();
    const snapshotRef = yield* Ref.make<ReadonlyArray<AuditIdType>>([]);
    const snapshotPubSub = yield* PubSub.unbounded<ReadonlyArray<AuditIdType>>();

    return {
      enqueue: (id: AuditIdType) =>
        Effect.gen(function* () {
          const xs = yield* Ref.get(snapshotRef);
          if (xs.includes(id)) {
            return;
          }

          yield* Ref.update(snapshotRef, (xs) => [...xs, id]);
          yield* Queue.offer(workQueue, id);
        }),
      dequeue: Effect.gen(function* () {
        const id = yield* Queue.take(workQueue);

        const next = yield* Ref.updateAndGet(snapshotRef, (xs) => {
          const idx = xs.indexOf(id);
          return idx < 0 ? xs : [...xs.slice(0, idx), ...xs.slice(idx + 1)];
        });

        yield* PubSub.publish(snapshotPubSub, next);

        return id;
      }),
      watch: (id: AuditIdType) => {
        return Stream.concat(Stream.fromEffect(Ref.get(snapshotRef)), Stream.fromPubSub(snapshotPubSub)).pipe(
          Stream.map((xs) => xs.indexOf(id)),
          Stream.takeUntil((idx) => idx <= 0),
        );
      },
    };
  }),
);
