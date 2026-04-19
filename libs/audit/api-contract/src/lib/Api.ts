import { HttpApi } from '@effect/platform';

import { AuditApiGroup } from './audit/Api';
import { HealthApiGroup } from './health/Api';
import { RunnerApiGroup } from './runner/Api';

export class Api extends HttpApi.make('api')
  .add(HealthApiGroup)
  .add(AuditApiGroup)
  .add(RunnerApiGroup)
  .prefix('/api') {}
