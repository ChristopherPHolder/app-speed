import { Context, Effect } from 'effect';

import type { AuditClaim } from '../queue/control-plane.effect';

export class AuditExecutor extends Context.Service<
  AuditExecutor,
  { execute: (claim: AuditClaim) => Effect.Effect<unknown, unknown> }
>()('AuditExecutor') {}
