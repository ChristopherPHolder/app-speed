import { timingSafeEqual } from 'node:crypto';
import { Config, Effect, Redacted } from 'effect';
import { HttpServerRequest } from 'effect/http';
import { HttpApiError } from 'effect/http-api';

export const requireRunnerIdentity = Effect.gen(function* () {
  const secret = Redacted.value(yield* Config.Redacted('RUNNER_API_TOKEN'));
  const request = yield* HttpServerRequest.HttpServerRequest;
  const supplied = request.headers['authorization'] ?? '';
  const expected = `Bearer ${secret}`;
  if (
    !secret ||
    supplied.length !== expected.length ||
    !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
  ) {
    return yield* new HttpApiError.Unauthorized();
  }
}).pipe(Effect.catchTag('ConfigError', () => new HttpApiError.Unauthorized()));
