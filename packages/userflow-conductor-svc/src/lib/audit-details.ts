import { APIGatewayProxyWebsocketEventV2 } from 'aws-lambda';
import { AuditRunParams, UfWsSendActions } from '@app-speed/shared';
import { ERROR_01, ERROR_02 } from './constants';

export function extractAuditDetails(event: APIGatewayProxyWebsocketEventV2): AuditRunParams {
  if (!event?.body || event.body === '') {
    throw new Error(ERROR_01);
  }
  const body: UfWsSendActions = JSON.parse(event.body);
  if (!body?.payload?.targetUrl) {
    throw new Error(ERROR_02);
  }
  return {
    targetUrl: body.payload.targetUrl,
    requesterId: event.requestContext.connectionId,
    endpoint: `https://${event.requestContext.domainName}/${event.requestContext.stage}`,
  };
}
