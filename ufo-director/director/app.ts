import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';

function generateResponse(
  responseCode: APIGatewayProxyResult['statusCode'],
  responseBody: APIGatewayProxyResult['body'],
  event: APIGatewayProxyEvent,
): APIGatewayProxyResult {
  return {
    statusCode: responseCode,
    headers: generateResponseHeader(event),
    body: responseBody,
  };
}

function generateResponseHeader(event: APIGatewayProxyEvent): APIGatewayProxyResult['headers'] {
  const origenDomain = event?.headers?.Origen;
  if (origenDomain) {
    return {
      'Access-Control-Allow-Origin': origenDomain,
      'Access-Control-Allow-Headers': 'x-requested-with',
      'Access-Control-Allow-Credentials': true,
    };
  }
}

// @TODO - open socket

// @TODO - message socket - action run-audit

// @TODO - close socket

// @TODO - error socket

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  let response: APIGatewayProxyResult;
  try {
    response = {
      statusCode: 200,
      body: JSON.stringify({
        message: 'hello world',
      }),
    };
  } catch (err) {
    console.log(err);
    response = {
      statusCode: 500,
      body: JSON.stringify({
        message: 'some error happened',
      }),
    };
  }

  return response;
};
