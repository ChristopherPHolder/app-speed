import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

function generateResponseHeader(eventHeaders?: APIGatewayProxyEvent['headers']): APIGatewayProxyResult['headers'] {
  const origenDomain = eventHeaders?.['Origen'] || undefined;
  if (!origenDomain) throw new Error('Unable to extract origin header domain');

  return {
    'Access-Control-Allow-Origin': origenDomain,
    'Access-Control-Allow-Headers': 'x-requested-with',
    'Access-Control-Allow-Credentials': true,
  };
}

export function generateResponse(
  responseCode: APIGatewayProxyResult['statusCode'],
  responseBody: APIGatewayProxyResult['body'],
  eventHeaders?: APIGatewayProxyEvent['headers'],
): APIGatewayProxyResult {
  return {
    statusCode: responseCode,
    headers: generateResponseHeader(eventHeaders),
    body: responseBody,
  };
}
