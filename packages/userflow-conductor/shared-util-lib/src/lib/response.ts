import { APIGatewayProxyResult } from 'aws-lambda';
import { ResponseStatus } from './http-status';

type ResponseFormater = (statusCode: ResponseStatus, body: string, origen?: string) => APIGatewayProxyResult;

export const formatedResponse: ResponseFormater = (statusCode, body, origen) => {
  if (!origen) {
    console.error('Unable to extract origin domain, used * instead');
  }

  const headers: APIGatewayProxyResult['headers'] = {
    'Access-Control-Allow-Origin': origen || '*',
    'Access-Control-Allow-Headers': 'x-requested-with',
    'Access-Control-Allow-Credentials': true,
  };

  return { statusCode, headers, body };
};
