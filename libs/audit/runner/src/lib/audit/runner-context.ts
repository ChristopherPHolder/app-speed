import { Config, Effect } from 'effect';
import { Browser, launch } from 'puppeteer';

import { type RunnerDeviceConfig } from './device-configuration';

export const RunnerContext = ({
  defaultViewport,
  userAgent,
}: Pick<RunnerDeviceConfig, 'defaultViewport' | 'userAgent'>) =>
  Effect.gen(function* () {
    const headless = yield* Config.boolean('RUNNER_HEADLESS').pipe(Config.withDefault(false));
    const browser = yield* Effect.acquireRelease(
      Effect.promise(() =>
        launch({
          headless,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          defaultViewport,
        }),
      ),
      (browser: Browser) => Effect.promise(() => browser.close()),
    );

    const page = yield* Effect.promise(() => browser.newPage());
    yield* Effect.promise(() => page.setUserAgent({ userAgent }));
    return { browser, page };
  }).pipe(Effect.withSpan('runner.audit.acquireContext'));
