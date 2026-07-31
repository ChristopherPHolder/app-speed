import { HttpApiGroup } from '@effect/platform';

import { listRunsEndpoint, runByIdEndpoint, runDetailsByIdEndpoint } from './runs/Api';

export class AuditApiGroup extends HttpApiGroup.make('audit')
  .add(listRunsEndpoint)
  .add(runByIdEndpoint)
  .add(runDetailsByIdEndpoint)
  .prefix('/audit') {}
