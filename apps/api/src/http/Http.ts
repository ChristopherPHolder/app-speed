import { HttpRouter, HttpServerResponse } from 'effect/http';
import { HttpApiBuilder, HttpApiSwagger } from 'effect/http-api';
import { NodeHttpServer } from '@effect/platform-node';
import { Config, Effect, Layer } from 'effect';
import { createServer } from 'node:http';

import { AuditGroupLive, HealthGroupLive, RunnerGroupLive } from '@app-speed/audit/core/api-runtime';
import { UserFlowAuditGroupLive } from '@app-speed/audit/user-flow/api-runtime';

import { WorkspaceGroupLive } from '@app-speed/workspace/api-runtime';

import { Api } from './Api.js';
import { McpLive } from '../mcp/Mcp.js';

const NoStore = HttpRouter.middleware((httpEffect) =>
  Effect.map(httpEffect, (response) => HttpServerResponse.setHeader(response, 'Cache-Control', 'no-store')),
);

const ApiLive = HttpApiBuilder.layer(Api).pipe(
  Layer.provide([WorkspaceGroupLive, HealthGroupLive, AuditGroupLive, RunnerGroupLive, UserFlowAuditGroupLive]),
  Layer.provide(NoStore.layer),
);

const RoutesLive = Layer.mergeAll(ApiLive, McpLive, HttpApiSwagger.layer(Api), HttpRouter.cors());

export const HttpLive = HttpRouter.serve(RoutesLive).pipe(
  Layer.provide(
    Layer.unwrap(
      Effect.map(Config.Int('PORT').pipe(Config.withDefault(3000)), (port) =>
        NodeHttpServer.layer(createServer, { port }),
      ),
    ),
  ),
);
