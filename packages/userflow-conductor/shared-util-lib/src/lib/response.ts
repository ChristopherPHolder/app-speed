import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export function formatedResponse(
  statusCode: APIGatewayProxyResult['statusCode'],
  body: APIGatewayProxyResult['body'],
  eventHeaders?: APIGatewayProxyEvent['headers'],
): APIGatewayProxyResult {
  const origenDomain = eventHeaders?.['Origen'] || '*';

  if (origenDomain === '*') {
    console.error('Unable to extract origin header domain');
  }

  const headers: APIGatewayProxyResult['headers'] = {
    'Access-Control-Allow-Origin': origenDomain || '*',
    'Access-Control-Allow-Headers': 'x-requested-with',
    'Access-Control-Allow-Credentials': true,
  };

  return { statusCode, headers, body };
}
