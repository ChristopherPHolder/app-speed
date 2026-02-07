import { Context, Effect, Layer, Schema } from 'effect';

const RunnerIdSchema = Schema.NonEmptyString.pipe(Schema.brand('RunnerId'));
const ActiveRunnerListSchema = Schema.Array(
  Schema.Struct({
    id: RunnerIdSchema,
    lastHeartbeatAt: Schema.DateFromSelf,
  }),
);
type ActiveRunnerList = typeof ActiveRunnerListSchema.Type;

export class RunnerManager extends Context.Tag('RunnerManager')<
  RunnerManager,
  {
    ensureRunnerActive: Effect.Effect<void, never>;
    listActiveRunners: Effect.Effect<ActiveRunnerList, never>;
    terminateRunner: (runnerId: string) => Effect.Effect<void, never>;
  }
>() {}

export const RunnerManagerLive = Layer.succeed(RunnerManager, {
  ensureRunnerActive: Effect.void,
  listActiveRunners: Effect.succeed([]),
  terminateRunner: () => Effect.void,
});
