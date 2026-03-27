import { HttpApiGroup } from '@effect/platform';

import { findByIdEndpoint, scheduleEndpoint, watchByIdEndpoint } from './builder/Api.js';
import { listRunsEndpoint, runByIdEndpoint } from './runs/Api.js';
import { reportByIdEndpoint, resultByIdEndpoint } from './viewer/Api.js';

export class AuditApiGroup extends HttpApiGroup.make('audit')
  .add(scheduleEndpoint)
  .add(findByIdEndpoint)
  .add(resultByIdEndpoint)
  .add(reportByIdEndpoint)
  .add(listRunsEndpoint)
  .add(runByIdEndpoint)
  .add(watchByIdEndpoint)
  .prefix('/audit') {}
