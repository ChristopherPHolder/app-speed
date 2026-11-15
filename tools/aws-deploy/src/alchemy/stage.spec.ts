import { Stage } from 'alchemy';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';

import { deployStage } from './stage';

const run = (stage: string) => Effect.runSyncExit(deployStage.pipe(Effect.provideService(Stage, stage)));

it.each(['development', 'production'])('deploys the %s stage', (stage) => {
  expect(run(stage)).toEqual(Exit.succeed(stage));
});

it('stops a deploy to any other stage', () => {
  expect(Exit.isFailure(run('live_ci'))).toBe(true);
});
