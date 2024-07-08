import { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from 'aws-lambda';
import { RESPONSE_SUCCESSFUL, RESPONSE_SERVER_ERROR } from '@app-speed/userflow-conductor/shared-util-lib';
import { extractedError, formatedResponse } from '@app-speed/userflow-conductor/shared-util-lib';

export const handler: Handler = async ({ headers }: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    return formatedResponse(RESPONSE_SUCCESSFUL.OK, '1', headers);
  } catch (error: unknown) {
    return formatedResponse(RESPONSE_SERVER_ERROR.INTERNAL_SERVER_ERROR, extractedError(error), headers);
  }
};
