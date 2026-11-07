import { HttpRouter } from 'effect/http';
import { HttpApiBuilder, HttpApiSwagger } from 'effect/http-api';
import { NodeHttpServer } from '@effect/platform-node';
import { Config, Effect, Layer } from 'effect';
import { createServer } from 'node:http';

import { AuditGroupLive, HealthGroupLive, RunnerGroupLive } from '@app-speed/audit/core/api-runtime';
import { UserFlowAuditGroupLive } from '@app-speed/audit/user-flow/api-runtime';

import { Api } from './Api.js';

const ApiLive = HttpApiBuilder.layer(Api).pipe(
  Layer.provide([HealthGroupLive, AuditGroupLive, RunnerGroupLive, UserFlowAuditGroupLive]),
);

const RoutesLive = Layer.mergeAll(ApiLive, HttpApiSwagger.layer(Api), HttpRouter.cors());

export const HttpLive = HttpRouter.serve(RoutesLive).pipe(
  Layer.provide(
    Layer.unwrap(
      Effect.map(Config.Int('PORT').pipe(Config.withDefault(3000)), (port) =>
        NodeHttpServer.layer(createServer, { port }),
      ),
    ),
  ),
);
