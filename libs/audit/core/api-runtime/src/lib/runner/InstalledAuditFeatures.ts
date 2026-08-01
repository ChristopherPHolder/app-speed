import { Context, Effect } from 'effect';

import type { AuditKind } from '@app-speed/audit/core/domain';
import type { AuditRunId, AuditTemplateId, QueryError } from '@app-speed/audit/core/persistence';

export class InstalledAuditFeatures extends Context.Service<
  InstalledAuditFeatures,
  {
    getDefinition: (kind: AuditKind, templateId: AuditTemplateId) => Effect.Effect<unknown, QueryError>;
    completeSuccess: (
      kind: AuditKind,
      id: AuditRunId,
      result: unknown,
      durationMs: number,
    ) => Effect.Effect<void, QueryError>;
  }
>()('InstalledAuditFeatures') {}
