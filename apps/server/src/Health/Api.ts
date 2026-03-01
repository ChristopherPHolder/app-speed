import { HttpApiEndpoint, HttpApiGroup } from '@effect/platform';
import { Schema } from 'effect';

export class HealthApiGroup extends HttpApiGroup.make('health').add(
  HttpApiEndpoint.get('get', '/health').addSuccess(Schema.String),
) {}
