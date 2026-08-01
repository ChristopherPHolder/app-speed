import { HttpApi } from 'effect/unstable/httpapi';

import { AuditApiGroup, HealthApiGroup, RunnerApiGroup } from '@app-speed/audit/core/api-contract';
import { UserFlowAuditApiGroup } from '@app-speed/audit/user-flow/api-contract';

export class Api extends HttpApi.make('api')
  .add(HealthApiGroup)
  .add(AuditApiGroup)
  .add(RunnerApiGroup)
  .add(UserFlowAuditApiGroup)
  .prefix('/api') {}
