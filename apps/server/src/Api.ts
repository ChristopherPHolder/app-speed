import { HttpApi } from '@effect/platform';
import { HealthGroup } from './Health/Api.js';
import { AuditGroup } from './Audit/Api.js';

export class Api extends HttpApi.make('api').add(HealthGroup).add(AuditGroup).prefix('/api') {}
