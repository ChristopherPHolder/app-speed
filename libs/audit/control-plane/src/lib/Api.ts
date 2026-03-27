import { HttpApi } from '@effect/platform';
import { AuditApiGroup } from './audit/Api.js';
import { HealthApiGroup } from './health/Api.js';
import { RunnerApiGroup } from './runner/Api.js';

export class Api extends HttpApi.make('api')
  .add(HealthApiGroup)
  .add(AuditApiGroup)
  .add(RunnerApiGroup)
  .prefix('/api') {}
