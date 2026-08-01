import { HttpApiEndpoint, HttpApiGroup } from 'effect/unstable/httpapi';
import { Schema } from 'effect';

export class HealthApiGroup extends HttpApiGroup.make('health').add(
  HttpApiEndpoint.get('get', '/health', { success: Schema.String }),
) {}
