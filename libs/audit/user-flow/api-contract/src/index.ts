import { HttpApi, HttpApiEndpoint, HttpApiError, HttpApiGroup } from 'effect/unstable/httpapi';
import { Schema } from 'effect';

import { UserFlowAuditDefinitionSchema } from '@app-speed/audit/user-flow/domain';
import {
  findByIdEndpoint,
  historyEndpoint,
  reportByIdEndpoint,
  resultByIdEndpoint,
  watchByIdEndpoint,
} from '@app-speed/audit/core/api-contract';

export const scheduleUserFlowAuditEndpoint = HttpApiEndpoint.post('scheduleUserFlowAudit', '/schedule', {
  payload: UserFlowAuditDefinitionSchema,
  success: Schema.Struct({
    auditId: Schema.String,
    auditQueuePosition: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0)),
  }),
  error: HttpApiError.BadRequestNoContent,
});

export class UserFlowAuditApiGroup extends HttpApiGroup.make('userFlowAudit')
  .add(scheduleUserFlowAuditEndpoint)
  .add(findByIdEndpoint)
  .add(watchByIdEndpoint)
  .add(resultByIdEndpoint)
  .add(reportByIdEndpoint)
  .add(historyEndpoint)
  .prefix('/audits/user-flow') {}

export class UserFlowApi extends HttpApi.make('api').add(UserFlowAuditApiGroup).prefix('/api') {}
