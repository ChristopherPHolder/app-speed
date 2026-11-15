import * as Alchemy from 'alchemy';
import * as Effect from 'effect/Effect';

import { awsProviders, awsState } from '../alchemy/aws.ts';
import { EXTRA_CONTENT_TYPES, REVALIDATE, SiteFiles } from '../alchemy/site-files.ts';
import { deployStage } from '../alchemy/stage.ts';

export default Alchemy.Stack(
  'app-speed-design-system',
  { providers: awsProviders('eu-central-1'), state: awsState },
  Effect.gen(function* () {
    // Both stages publish the one Storybook site.
    yield* deployStage;
    const files = yield* SiteFiles('StorybookFiles', {
      bucketName: 'ds.appspeed.dev',
      sourcePath: 'dist/storybook/design-system',
      // Storybook's manager, addons and index keep their names across builds, so nothing is cached as immutable.
      // HTML keeps the default: never cached.
      rules: [{ files: '**', ignore: '**/*.html', cacheControl: REVALIDATE }, ...EXTRA_CONTENT_TYPES],
    });
    return { bucketName: files.bucketName, version: files.version, fileCount: files.fileCount };
  }),
);
