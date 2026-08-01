import { HttpApi } from 'effect/unstable/httpapi';

import { AuditApiGroup } from './audit/Api';
import { HealthApiGroup } from './health/Api';
import { RunnerApiGroup } from './runner/Api';

export class CoreApi extends HttpApi.make('api')
  .add(HealthApiGroup)
  .add(AuditApiGroup)
  .add(RunnerApiGroup)
  .prefix('/api') {}
