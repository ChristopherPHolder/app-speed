import { HttpApiGroup } from '@effect/platform';

import { findByIdEndpoint, scheduleEndpoint, watchByIdEndpoint } from './builder/Api';
import { listRunsEndpoint, runByIdEndpoint, runDetailsByIdEndpoint } from './runs/Api';
import { reportByIdEndpoint, resultByIdEndpoint } from './viewer/Api';

export class AuditApiGroup extends HttpApiGroup.make('audit')
  .add(scheduleEndpoint)
  .add(findByIdEndpoint)
  .add(resultByIdEndpoint)
  .add(reportByIdEndpoint)
  .add(listRunsEndpoint)
  .add(runByIdEndpoint)
  .add(runDetailsByIdEndpoint)
  .add(watchByIdEndpoint)
  .prefix('/audit') {}
