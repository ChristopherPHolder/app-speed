import { Context, Effect, Schema } from 'effect';

export const RunnerIdSchema = Schema.NonEmptyString.pipe(Schema.brand('RunnerId'));
export const ActiveRunnerListSchema = Schema.Array(
  Schema.Struct({
    id: RunnerIdSchema,
    lastHeartbeatAt: Schema.DateFromSelf,
  }),
);
export type ActiveRunnerList = typeof ActiveRunnerListSchema.Type;

export class RunnerManager extends Context.Tag('RunnerManager')<
  RunnerManager,
  {
    ensureRunnerActive: Effect.Effect<void, never>;
    listActiveRunners: Effect.Effect<ActiveRunnerList, never>;
    terminateRunner: (runnerId: string) => Effect.Effect<void, never>;
  }
>() {}
