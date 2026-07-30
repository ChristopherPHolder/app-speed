import { HttpApiBuilder, HttpApiSwagger, HttpMiddleware, HttpServer } from '@effect/platform';
import { NodeHttpServer } from '@effect/platform-node';
import { Layer } from 'effect';
import { createServer } from 'node:http';

import { AuditGroupLive, HealthGroupLive, RunnerGroupLive } from '@app-speed/audit/core/api-runtime';
import { UserFlowAuditGroupLive } from '@app-speed/audit/user-flow/api-runtime';

import { Api } from './Api.js';

const ApiLive = HttpApiBuilder.api(Api).pipe(
  Layer.provide([HealthGroupLive, AuditGroupLive, RunnerGroupLive, UserFlowAuditGroupLive]),
);

export const HttpLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(HttpApiSwagger.layer()),
  Layer.provide(HttpApiBuilder.middlewareCors()),
  Layer.provide(ApiLive),
  HttpServer.withLogAddress,
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 })),
);
