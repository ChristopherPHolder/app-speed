import { HttpApiEndpoint, HttpApiGroup } from '@effect/platform';
import { Schema } from 'effect';
import { ReplayUserflowAuditSchema } from '@app-speed/shared-user-flow-replay/schema';
import { AuditNotFoundError, AuditId } from './Audit';
import { QueryErrorApi } from '../Db';

export class AuditGroup extends HttpApiGroup.make('audit')
  .add(
    HttpApiEndpoint.post('schedule', '/audit/schedule')
      .setPayload(ReplayUserflowAuditSchema)
      .addSuccess(Schema.String)
      .addError(QueryErrorApi),
  )
  .add(
    HttpApiEndpoint.get('findById', '/audit/:id')
      .setPath(Schema.Struct({ id: AuditId }))
      .addSuccess(Schema.String)
      .addError(AuditNotFoundError)
      .addError(QueryErrorApi),
  ) {}
