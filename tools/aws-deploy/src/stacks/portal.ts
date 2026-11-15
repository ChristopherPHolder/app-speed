import * as Alchemy from 'alchemy';
import * as Effect from 'effect/Effect';

import { awsProviders, awsState } from '../alchemy/aws.ts';
import { EXTRA_CONTENT_TYPES, REVALIDATE, SiteFiles } from '../alchemy/site-files.ts';
import { deployStage } from '../alchemy/stage.ts';
import type { DeployStage } from '../alchemy/stage.ts';

/** Website buckets behind the portal's CloudFront distributions. */
const BUCKETS: Record<DeployStage, string> = {
  development: 'dev.appspeed.dev',
  production: 'appspeed.dev',
};

export default Alchemy.Stack(
  'app-speed-portal',
  { providers: awsProviders('us-east-1'), state: awsState },
  Effect.gen(function* () {
    const stage = yield* deployStage;
    const files = yield* SiteFiles('PortalFiles', {
      bucketName: BUCKETS[stage],
      sourcePath: 'dist/apps/portal',
      // Bundles, styles and fonts have hashed names and stay immutable. These keep their names across builds.
      rules: [
        { files: ['favicon.ico', 'assets/**', '**/*.txt', '**/*.json'], cacheControl: REVALIDATE },
        ...EXTRA_CONTENT_TYPES,
      ],
    });
    return { bucketName: files.bucketName, version: files.version, fileCount: files.fileCount };
  }),
);
