import { Stage } from 'alchemy';
import * as Effect from 'effect/Effect';

export const DEPLOY_STAGES = ['development', 'production'] as const;

/** Alchemy stages match the Nx `deploy` configurations. */
export type DeployStage = (typeof DEPLOY_STAGES)[number];

export const isDeployStage = (stage: string): stage is DeployStage =>
  (DEPLOY_STAGES as readonly string[]).includes(stage);

/** The stage being deployed. Any other stage is a mistake, so it stops the deploy before a plan is made. */
export const deployStage = Effect.service(Stage).pipe(
  Effect.filterOrElse(isDeployStage, (stage) =>
    Effect.die(new Error(`Unknown stage "${stage}". Deploy with --stage ${DEPLOY_STAGES.join(' or --stage ')}.`)),
  ),
);
