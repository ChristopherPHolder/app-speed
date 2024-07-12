import { APIGatewayProxyResult, APIGatewayProxyWebsocketEventV2, Handler } from 'aws-lambda';
import {
  extractedError,
  formatedResponse,
  RESPONSE_SERVER_ERROR,
  RESPONSE_SUCCESSFUL,
} from '@app-speed/userflow-conductor/shared-util-lib';

const enum EVENT_TYPE {
  CONNECT = 'CONNECT',
  DISCONNECT = 'DISCONNECT',
  MESSAGE = 'MESSAGE',
}

export const handler: Handler<APIGatewayProxyWebsocketEventV2, APIGatewayProxyResult> = async (event, context) => {
  console.log('-- > ', event, context);
  try {
    const { eventType, domainName } = event.requestContext;
    const { functionName } = context;
    switch (eventType) {
      case EVENT_TYPE.CONNECT:
        return formatedResponse(RESPONSE_SUCCESSFUL.CREATED, 'Successfully connected to web socket', domainName);
      case EVENT_TYPE.DISCONNECT:
        return formatedResponse(RESPONSE_SUCCESSFUL.NO_CONTENT, 'Successfully disconnected to web socket', domainName);
      case EVENT_TYPE.MESSAGE:
        console.warn(JSON.stringify({ event, context }, null, 2));
        return formatedResponse(
          RESPONSE_SERVER_ERROR.NOT_IMPLEMENTED,
          'Received unexpected message in ' + functionName,
          domainName,
        );
      default:
        console.warn(JSON.stringify({ event, context }, null, 2));
        return formatedResponse(
          RESPONSE_SERVER_ERROR.NOT_IMPLEMENTED,
          'Received unexpected message in ' + functionName,
          domainName,
        );
    }
  } catch (error) {
    console.error('Catcher', event, context, error);
    return formatedResponse(RESPONSE_SERVER_ERROR.INTERNAL_SERVER_ERROR, extractedError(error));
  }
};
