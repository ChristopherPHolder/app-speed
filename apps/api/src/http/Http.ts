import { HttpRouter, HttpServerResponse } from 'effect/http';
import { HttpApiBuilder, HttpApiSwagger } from 'effect/http-api';
import { NodeHttpServer } from '@effect/platform-node';
import { Effect, Layer } from 'effect';
import { createServer } from 'node:http';

import { AuditGroupLive, HealthGroupLive, RunnerGroupLive } from '@app-speed/audit/core/api-runtime';
import { UserFlowAuditGroupLive } from '@app-speed/audit/user-flow/api-runtime';

import { ClerkConfigRoutes } from '@app-speed/platform/auth-api';
import { Api } from './Api.js';

const ApiLive = HttpApiBuilder.layer(Api).pipe(
  Layer.provide([HealthGroupLive, AuditGroupLive, RunnerGroupLive, UserFlowAuditGroupLive]),
);

const PrivacyLive = HttpRouter.middleware(
  (response) =>
    Effect.map(
      response,
      HttpServerResponse.setHeaders({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' }),
    ),
  { global: true },
);
const RoutesLive = Layer.mergeAll(
  ApiLive,
  ClerkConfigRoutes,
  HttpApiSwagger.layer(Api),
  HttpRouter.cors(),
  PrivacyLive,
);

export const HttpLive = HttpRouter.serve(RoutesLive).pipe(
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 })),
);
