import { HttpApiGroup } from 'effect/http-api';

import { historyEndpoint } from './history/Api';

export class AuditApiGroup extends HttpApiGroup.make('audit').add(historyEndpoint).prefix('/audits') {}
