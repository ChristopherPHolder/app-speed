import { Context, Effect } from 'effect';

import type { AuditClaim } from '../queue/control-plane.effect';

export class AuditExecutor extends Context.Tag('AuditExecutor')<
  AuditExecutor,
  { execute: (claim: AuditClaim) => Effect.Effect<unknown, unknown> }
>() {}
