import { HttpApiGroup } from 'effect/unstable/httpapi';

import { historyEndpoint } from './history/Api';

export class AuditApiGroup extends HttpApiGroup.make('audit').add(historyEndpoint).prefix('/audits') {}
