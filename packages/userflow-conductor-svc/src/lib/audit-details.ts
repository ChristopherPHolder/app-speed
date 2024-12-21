import { APIGatewayProxyWebsocketEventV2 } from 'aws-lambda';
import { AUDIT_REQUEST, AuditRunParams, UfWsSendActions } from '@app-speed/shared-utils';
import { ERROR_01, ERROR_02 } from './constants';

export function extractAuditDetails(event: APIGatewayProxyWebsocketEventV2): AuditRunParams {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  if (event['action'] === AUDIT_REQUEST.SCHEDULE_AUDIT) {
    console.log('extractAuditDetails', event);
  }
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
