import { HttpApiBuilder, HttpApiSwagger, HttpMiddleware, HttpServer } from '@effect/platform';
import { NodeHttpServer } from '@effect/platform-node';
import { Layer } from 'effect';
import { createServer } from 'node:http';
import { Api } from './Api.js';
import { AuditGroupLive } from './audit/Http.js';
import { HealthGroupLive } from './health/Http.js';
import { RunnerGroupLive } from './runner/Http.js';

const ApiLive = HttpApiBuilder.api(Api).pipe(Layer.provide([HealthGroupLive, AuditGroupLive, RunnerGroupLive]));

export const HttpLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(HttpApiSwagger.layer()),
  Layer.provide(HttpApiBuilder.middlewareCors()),
  Layer.provide(ApiLive),
  HttpServer.withLogAddress,
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 })),
);
