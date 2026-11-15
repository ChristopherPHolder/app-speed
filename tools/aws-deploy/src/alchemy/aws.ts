import * as AWS from '@alchemy.run/aws';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

/** Every stack keeps its state in the same table, wherever its resources live. */
const STATE_REGION = 'eu-central-1';

/**
 * The AWS environment pinned to `region`. Alchemy pins a stack's providers to one environment, so each stack deploys
 * to its resources' region whatever `AWS_REGION` says. The environment is one provided from outside, or else the
 * ambient one (CI credentials or the local profile).
 */
const inRegion = (region: string) =>
  Layer.effect(
    AWS.AWSEnvironment,
    Effect.map(Effect.service(AWS.AWSEnvironment), (environment) =>
      Effect.map(environment, (resolved) => ({ ...resolved, region })),
    ),
  ).pipe(Layer.provide(AWS.providedOrDefault()));

export const awsProviders = (region: string): ReturnType<typeof AWS.providers> =>
  AWS.providers().pipe(Layer.provide(inRegion(region)));

export const awsState: ReturnType<typeof AWS.state> = AWS.state().pipe(Layer.provide(inRegion(STATE_REGION)));
