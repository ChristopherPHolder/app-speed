import { Effect, Queue, Ref, Schema, Stream, PubSub, Context, Layer } from 'effect';
import { AuditIdType } from './Audit';

const AuditQueuePosition = Schema.NonNegativeInt.pipe(Schema.brand('AuditQueuePosition'));
type AuditQueuePositionType = typeof AuditQueuePosition.Type;

class AuditQueue extends Context.Tag('AuditQueue')<
  AuditQueue,
  {
    readonly enqueue: (id: AuditIdType) => Effect.Effect<void>;
    readonly dequeue: Effect.Effect<AuditIdType>;
    readonly watch: (id: AuditIdType) => Stream.Stream<AuditQueuePositionType>;
  }
>() {}

export const AuditQueueLive = Layer.effect(
  AuditQueue,
  Effect.gen(function* () {
    const workQueue = yield* Queue.unbounded<AuditIdType>();
    const snapshotRef = yield* Ref.make<ReadonlyArray<AuditIdType>>([]);

    const snapshots = yield* PubSub.unbounded<ReadonlyArray<AuditIdType>>();
    const publish = (xs: ReadonlyArray<AuditIdType>) => PubSub.publish(snapshots, xs);

    return {
      enqueue: (id: AuditIdType) =>
        Effect.gen(function* () {
          const xs = yield* Ref.get(snapshotRef);
          if (xs.includes(id)) {
            return;
          }

          const next = [...xs, id];
          yield* Ref.set(snapshotRef, next);

          yield* Queue.offer(workQueue, id);

          // TODO do not need to publish here
          yield* publish(next);
        }),
      dequeue: Effect.gen(function* () {
        // TODO Probably should check if items remain
        const id = yield* Queue.take(workQueue);

        const next = yield* Ref.updateAndGet(snapshotRef, (xs) => {
          const idx = xs.indexOf(id);
          return idx < 0 ? xs : [...xs.slice(0, idx), ...xs.slice(idx + 1)];
        });

        yield* publish(next);
        return id;
      }),
      watch: (id: AuditIdType) => {
        const snapshotsStream = Stream.concat(Stream.fromEffect(Ref.get(snapshotRef)), Stream.fromPubSub(snapshots));

        return snapshotsStream.pipe(
          Stream.map((xs) => xs.indexOf(id)),
          Stream.takeWhile((idx) => idx >= 0),
          Stream.changes,
          Stream.map((idx) => idx as AuditQueuePositionType),
        );
      },
    };
  }),
);
