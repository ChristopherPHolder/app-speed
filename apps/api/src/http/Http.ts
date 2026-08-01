import { HttpRouter } from 'effect/unstable/http';
import { HttpApiBuilder, HttpApiSwagger } from 'effect/unstable/httpapi';
import { NodeHttpServer } from '@effect/platform-node';
import { Layer } from 'effect';
import { createServer } from 'node:http';

import { AuditGroupLive, HealthGroupLive, RunnerGroupLive } from '@app-speed/audit/core/api-runtime';
import { UserFlowAuditGroupLive } from '@app-speed/audit/user-flow/api-runtime';

import { Api } from './Api.js';

const ApiLive = HttpApiBuilder.layer(Api).pipe(
  Layer.provide([HealthGroupLive, AuditGroupLive, RunnerGroupLive, UserFlowAuditGroupLive]),
);

const RoutesLive = Layer.mergeAll(ApiLive, HttpApiSwagger.layer(Api), HttpRouter.cors());

export const HttpLive = HttpRouter.serve(RoutesLive).pipe(
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 })),
);
