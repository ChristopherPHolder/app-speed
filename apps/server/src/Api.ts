import { HttpApi } from '@effect/platform';
import { HealthApiGroup } from './Health/Api.js';
import { AuditApiGroup } from './Audit/Api.js';
import { RunnerApiGroup } from './Runner/Api.js';

export class Api extends HttpApi.make('api')
  .add(HealthApiGroup)
  .add(AuditApiGroup)
  .add(RunnerApiGroup)
  .prefix('/api') {}
