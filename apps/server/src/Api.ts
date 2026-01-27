import { HttpApi } from '@effect/platform';
import { HealthGroup } from './Health/Api.js';
import { AuditApiGroup } from './Audit/Api.js';

export class Api extends HttpApi.make('api').add(HealthGroup).add(AuditApiGroup).prefix('/api') {}
