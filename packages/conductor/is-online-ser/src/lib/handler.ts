import { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from 'aws-lambda';
import { RESPONSE_SUCCESSFUL, RESPONSE_SERVER_ERROR } from '@app-speed/conductor/shared-util-lib';
import { extractedError, formatedResponse } from '@app-speed/conductor/shared-util-lib';

export const handler: Handler<APIGatewayProxyEvent, APIGatewayProxyResult> = async (event, context) => {
  try {
    console.log('-- > ', event, context);
    const { domainName } = event.requestContext;
    return formatedResponse(RESPONSE_SUCCESSFUL.OK, '1', domainName);
  } catch (error: unknown) {
    return formatedResponse(RESPONSE_SERVER_ERROR.INTERNAL_SERVER_ERROR, extractedError(error));
  }
};
