import { HttpApi, HttpApiEndpoint, HttpApiError, HttpApiGroup } from 'effect/http-api';
import { Schema } from 'effect';

import { UserFlowAuditDefinitionSchema } from '@app-speed/audit/user-flow/domain';
import {
  AuditId,
  AuditNotFoundError,
  AuditRunStatusSchema,
  historyEndpoint,
  reportByIdEndpoint,
  resultByIdEndpoint,
  watchByIdEndpoint,
} from '@app-speed/audit/core/api-contract';

export { AuditId };
export { ManagementOverviewSchema, OccurrenceHistorySchema, AuditManagementCommandSchema } from './management';
export type { AuditManagementCommand } from './management';
import { AuditManagementCommandSchema } from './management';

export const findUserFlowAuditByIdEndpoint = HttpApiEndpoint.get('findUserFlowAuditById', '/:id', {
  params: { id: AuditId },
  success: Schema.Struct({
    status: AuditRunStatusSchema,
    audit: UserFlowAuditDefinitionSchema,
  }),
  error: [HttpApiError.BadRequestNoContent, HttpApiError.NotFoundNoContent, AuditNotFoundError],
});

export const scheduleUserFlowAuditEndpoint = HttpApiEndpoint.post('scheduleUserFlowAudit', '/schedule', {
  payload: UserFlowAuditDefinitionSchema,
  success: Schema.Struct({
    auditId: Schema.String,
    claimToken: Schema.NullOr(Schema.String),
    auditQueuePosition: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0)),
  }),
  error: [HttpApiError.BadRequestNoContent, HttpApiError.ForbiddenNoContent, HttpApiError.UnauthorizedNoContent],
});

export const manageAuditEndpoint = HttpApiEndpoint.post('manage', '/manage', {
  payload: AuditManagementCommandSchema,
  success: Schema.Unknown,
  error: [HttpApiError.BadRequestNoContent, HttpApiError.ForbiddenNoContent, HttpApiError.UnauthorizedNoContent],
});

export class UserFlowAuditApiGroup extends HttpApiGroup.make('userFlowAudit')
  .add(manageAuditEndpoint)
  .add(scheduleUserFlowAuditEndpoint)
  .add(findUserFlowAuditByIdEndpoint)
  .add(watchByIdEndpoint)
  .add(resultByIdEndpoint)
  .add(reportByIdEndpoint)
  .add(historyEndpoint)
  .prefix('/audits/user-flow') {}

export class UserFlowApi extends HttpApi.make('api').add(UserFlowAuditApiGroup).prefix('/api') {}
