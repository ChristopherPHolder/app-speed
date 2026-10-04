import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api';
import { Schema } from 'effect';

export class HealthApiGroup extends HttpApiGroup.make('health').add(
  HttpApiEndpoint.get('get', '/health', { success: Schema.String }),
) {}
