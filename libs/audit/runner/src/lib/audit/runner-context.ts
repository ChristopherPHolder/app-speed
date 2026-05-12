import { Config, Effect, Option } from 'effect';
import { Browser, launch, type Viewport } from 'puppeteer';

export const RunnerContext = Effect.fn('runner.audit.acquireContext')(function* ({
  defaultViewport,
  userAgent,
}: {
  defaultViewport: Viewport;
  userAgent: string;
}) {
  const headless = yield* Config.boolean('RUNNER_HEADLESS').pipe(Config.withDefault(false));
  const browser = yield* Effect.acquireRelease(
    Effect.promise(() => launch({ headless, args: ['--no-sandbox', '--disable-setuid-sandbox'], defaultViewport })),
    (browser: Browser) => Effect.promise(() => browser.close()),
  );

  const page = yield* Effect.promise(() => browser.pages()).pipe(
    Effect.map((pages) => Option.fromNullable(pages.at(0))),
    Effect.flatMap(
      Option.match({
        onSome: (page) => Effect.succeed(page),
        onNone: () => Effect.promise(() => browser.newPage()),
      }),
    ),
  );

  yield* Effect.promise(() => page.setUserAgent({ userAgent }));
  return { browser, page };
});
