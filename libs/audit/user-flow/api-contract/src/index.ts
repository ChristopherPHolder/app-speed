import { HttpApi, HttpApiEndpoint, HttpApiError, HttpApiGroup } from '@effect/platform';
import { Schema } from 'effect';

import { UserFlowAuditDefinitionSchema } from '@app-speed/audit/user-flow/domain';
import {
  findByIdEndpoint,
  reportByIdEndpoint,
  resultByIdEndpoint,
  watchByIdEndpoint,
} from '@app-speed/audit/core/api-contract';

export const scheduleUserFlowAuditEndpoint = HttpApiEndpoint.post('scheduleUserFlowAudit', '/schedule')
  .setPayload(UserFlowAuditDefinitionSchema)
  .addSuccess(
    Schema.Struct({
      auditId: Schema.String,
      auditQueuePosition: Schema.NonNegativeInt,
    }),
  )
  .addError(HttpApiError.HttpApiDecodeError)
  .addError(HttpApiError.BadRequest);

export class UserFlowAuditApiGroup extends HttpApiGroup.make('userFlowAudit')
  .add(scheduleUserFlowAuditEndpoint)
  .add(findByIdEndpoint)
  .add(watchByIdEndpoint)
  .add(resultByIdEndpoint)
  .add(reportByIdEndpoint)
  .prefix('/audits/user-flow') {}

export class UserFlowApi extends HttpApi.make('api').add(UserFlowAuditApiGroup).prefix('/api') {}
