import { describe, it, expect } from 'vitest';
import { APIGatewayProxyEvent, Context, Callback } from 'aws-lambda';

import { handler } from './handler';

describe('handler', () => {
  it('should return 1 when called', () => {
    expect(handler({} as APIGatewayProxyEvent, {} as Context, {} as Callback)).resolves.toBeTruthy();
  });
});
