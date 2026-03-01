import {
  DescribeInstancesCommand,
  EC2Client,
  StartInstancesCommand,
  StopInstancesCommand,
  waitUntilInstanceRunning,
  waitUntilInstanceStopped,
} from '@aws-sdk/client-ec2';
import { Effect, Either, Layer, Option, Schema } from 'effect';
import { RunnerIdSchema, RunnerManager, type ActiveRunnerList } from './RunnerManager.js';

const DEFAULT_WAIT_TIMEOUT_MS = 10 * 60 * 1000;
const AWS_RUNNER_REGION = 'eu-central-1';
const AWS_RUNNER_INSTANCE_IDS = ['i-049287bf43503d01e'] as const;

const Ec2InstanceIdSchema = Schema.NonEmptyString.pipe(
  Schema.pattern(/^i-[a-z0-9]+$/),
  Schema.brand('Ec2InstanceId'),
);
const Ec2RunnerIdSchema = Schema.TemplateLiteral('ec2-', Ec2InstanceIdSchema).pipe(Schema.brand('Ec2RunnerId'));
const Ec2InstanceLifecycleStateSchema = Schema.Literal(
  'pending',
  'running',
  'shutting-down',
  'terminated',
  'stopping',
  'stopped',
  'unknown',
);
const ActiveEc2InstanceLifecycleStateSchema = Schema.Literal('pending', 'running');

const Ec2InstanceStateSchema = Schema.Struct({
  instanceId: Ec2InstanceIdSchema,
  state: Ec2InstanceLifecycleStateSchema,
});

const AwsRunnerManagerConfigSchema = Schema.Struct({
  region: Schema.NonEmptyString,
  instanceIds: Schema.NonEmptyArray(Ec2InstanceIdSchema),
  startWaitTimeoutMs: Schema.Positive,
  stopWaitTimeoutMs: Schema.Positive,
});

type Ec2InstanceId = typeof Ec2InstanceIdSchema.Type;
type Ec2RunnerId = typeof Ec2RunnerIdSchema.Type;
type Ec2InstanceState = typeof Ec2InstanceStateSchema.Type;
type AwsRunnerManagerConfig = typeof AwsRunnerManagerConfigSchema.Type;

const awsRunnerManagerConfig = Schema.decodeUnknownSync(AwsRunnerManagerConfigSchema)({
  region: AWS_RUNNER_REGION,
  instanceIds: [...AWS_RUNNER_INSTANCE_IDS],
  startWaitTimeoutMs: DEFAULT_WAIT_TIMEOUT_MS,
  stopWaitTimeoutMs: DEFAULT_WAIT_TIMEOUT_MS,
});

const decodeRunnerId = (value: string) => Schema.decodeSync(RunnerIdSchema)(value);
const decodeEc2InstanceId = Schema.decodeUnknownEither(Ec2InstanceIdSchema);
const decodeEc2RunnerId = Schema.decodeUnknownEither(Ec2RunnerIdSchema);
const decodeEc2InstanceState = Schema.decodeUnknownEither(Ec2InstanceStateSchema);
const decodeActiveLifecycleState = Schema.decodeUnknownEither(ActiveEc2InstanceLifecycleStateSchema);
const toManagedRunnerId = (instanceId: Ec2InstanceId) => decodeRunnerId(`ec2-${instanceId}`);
const isActiveEc2InstanceState = (state: Ec2InstanceState['state']): boolean =>
  Either.isRight(decodeActiveLifecycleState(state));

const parseManagedInstanceId = (runnerId: string): Option.Option<Ec2InstanceId> => {
  const maybeInstanceId = decodeEc2InstanceId(runnerId);
  if (Either.isRight(maybeInstanceId)) {
    return Option.some(maybeInstanceId.right);
  }

  const maybeRunnerId = decodeEc2RunnerId(runnerId);
  if (Either.isLeft(maybeRunnerId)) {
    return Option.none();
  }

  const instanceIdFromRunnerId = String(maybeRunnerId.right).slice('ec2-'.length);
  const decodedInstanceId = decodeEc2InstanceId(instanceIdFromRunnerId);
  return Either.isRight(decodedInstanceId) ? Option.some(decodedInstanceId.right) : Option.none();
};

const describeInstances = (
  client: EC2Client,
  region: string,
  instanceIds: ReadonlyArray<Ec2InstanceId>,
): Effect.Effect<ReadonlyArray<Ec2InstanceState>, Error> =>
  Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () => client.send(new DescribeInstancesCommand({ InstanceIds: [...instanceIds] })),
      catch: (error) =>
        new Error(`Failed to describe EC2 instances (${instanceIds.join(', ')}) in ${region}: ${String(error)}`),
    });

    const instances: Ec2InstanceState[] = [];
    for (const reservation of response.Reservations ?? []) {
      for (const instance of reservation.Instances ?? []) {
        if (instance.InstanceId !== undefined) {
          const decodedState = decodeEc2InstanceState({
            instanceId: instance.InstanceId,
            state: instance.State?.Name ?? 'unknown',
          });
          if (Either.isLeft(decodedState)) {
            return yield* Effect.fail(
              new Error(`AWS returned invalid EC2 instance payload for ${instance.InstanceId}`),
            );
          }

          instances.push(decodedState.right);
        }
      }
    }

    return instances;
  });

const startInstance = (
  client: EC2Client,
  instanceId: Ec2InstanceId,
  startWaitTimeoutMs: number,
): Effect.Effect<void, Error> =>
  Effect.gen(function* () {
    yield* Effect.tryPromise({
      try: () => client.send(new StartInstancesCommand({ InstanceIds: [instanceId] })),
      catch: (error) => new Error(`Failed to start instance ${instanceId}: ${String(error)}`),
    });

    const waiter = yield* Effect.tryPromise({
      try: () =>
        waitUntilInstanceRunning(
          {
            client,
            maxWaitTime: Math.max(1, Math.ceil(startWaitTimeoutMs / 1000)),
          },
          { InstanceIds: [instanceId] },
        ),
      catch: (error) => new Error(`Failed while waiting for instance ${instanceId} to start: ${String(error)}`),
    });

    if (waiter.state !== 'SUCCESS') {
      return yield* Effect.fail(
        new Error(`Instance ${instanceId} did not reach running state in time: waiter state=${waiter.state}`),
      );
    }
  });

const stopInstance = (
  client: EC2Client,
  instanceId: Ec2InstanceId,
  stopWaitTimeoutMs: number,
): Effect.Effect<void, Error> =>
  Effect.gen(function* () {
    yield* Effect.tryPromise({
      try: () => client.send(new StopInstancesCommand({ InstanceIds: [instanceId] })),
      catch: (error) => new Error(`Failed to stop instance ${instanceId}: ${String(error)}`),
    });

    const waiter = yield* Effect.tryPromise({
      try: () =>
        waitUntilInstanceStopped(
          {
            client,
            maxWaitTime: Math.max(1, Math.ceil(stopWaitTimeoutMs / 1000)),
          },
          { InstanceIds: [instanceId] },
        ),
      catch: (error) => new Error(`Failed while waiting for instance ${instanceId} to stop: ${String(error)}`),
    });

    if (waiter.state !== 'SUCCESS') {
      return yield* Effect.fail(
        new Error(`Instance ${instanceId} did not reach stopped state in time: waiter state=${waiter.state}`),
      );
    }
  });

export const AwsRunnerManagerLive = Layer.effect(
  RunnerManager,
  Effect.gen(function* () {
    const config: AwsRunnerManagerConfig = awsRunnerManagerConfig;
    const client = new EC2Client({ region: config.region });

    const ensureRunnerActive = Effect.gen(function* () {
      const instances = yield* describeInstances(client, config.region, config.instanceIds);
      const activeInstances = instances.filter((instance) => isActiveEc2InstanceState(instance.state));
      yield* Effect.annotateCurrentSpan({
        'runner.manager.mode': 'aws',
        'runner.aws.region': config.region,
        'runner.aws.instance_count': config.instanceIds.length,
        'runner.aws.active_count': activeInstances.length,
      });

      if (activeInstances.length > 0) {
        return;
      }

      const targetInstanceId = config.instanceIds[0];
      yield* Effect.annotateCurrentSpan({
        'runner.aws.starting_instance_id': targetInstanceId,
      });
      yield* startInstance(client, targetInstanceId, config.startWaitTimeoutMs);
    }).pipe(
      Effect.withSpan('runner.manager.ensureActive'),
      Effect.catchAll((error) =>
        Effect.logError(error).pipe(
          Effect.zipRight(Effect.annotateCurrentSpan({ 'runner.aws.start_error': String(error) })),
          Effect.asVoid,
        ),
      ),
    );

    const listActiveRunners = describeInstances(client, config.region, config.instanceIds).pipe(
      Effect.map((instances): ActiveRunnerList =>
        instances
          .filter((instance) => isActiveEc2InstanceState(instance.state))
          .map((instance) => ({
            id: toManagedRunnerId(instance.instanceId),
            lastHeartbeatAt: new Date(),
          })),
      ),
      Effect.tap((runners) =>
        Effect.annotateCurrentSpan({
          'runner.manager.mode': 'aws',
          'runner.list_count': runners.length,
        }),
      ),
      Effect.withSpan('runner.manager.listActive'),
      Effect.catchAll((error) =>
        Effect.logError(error).pipe(
          Effect.zipRight(Effect.annotateCurrentSpan({ 'runner.aws.list_error': String(error) })),
          Effect.as([] satisfies ActiveRunnerList),
        ),
      ),
    );

    const terminateRunner = (runnerId: string) =>
      Effect.gen(function* () {
        const parsedInstanceId = parseManagedInstanceId(runnerId);
        const isManaged = Option.isSome(parsedInstanceId) && config.instanceIds.includes(parsedInstanceId.value);
        yield* Effect.annotateCurrentSpan({
          'runner.manager.mode': 'aws',
          'runner.id': runnerId,
          'runner.aws.instance_id': Option.match(parsedInstanceId, {
            onNone: () => null,
            onSome: (instanceId) => instanceId,
          }),
          'runner.terminate_found': isManaged,
        });

        if (!isManaged) {
          return;
        }

        yield* stopInstance(client, parsedInstanceId.value, config.stopWaitTimeoutMs);
      }).pipe(
        Effect.withSpan('runner.manager.terminate'),
        Effect.catchAll((error) =>
          Effect.logError(error).pipe(
            Effect.zipRight(Effect.annotateCurrentSpan({ 'runner.aws.terminate_error': String(error) })),
            Effect.asVoid,
          ),
        ),
      );

    return {
      ensureRunnerActive,
      listActiveRunners,
      terminateRunner,
    };
  }).pipe(Effect.withSpan('runner.manager.aws.init')),
);
