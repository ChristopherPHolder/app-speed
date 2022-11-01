import { APIGatewayProxyResult, APIGatewayProxyEvent, APIGatewayProxyWebsocketEventV2 } from 'aws-lambda';

function generateResponse(
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

function generateResponseHeader(eventHeaders?: APIGatewayProxyEvent['headers']): APIGatewayProxyResult['headers'] {
  const origenDomain = eventHeaders?.Origen || undefined;
  if (origenDomain) {
    return {
      'Access-Control-Allow-Origin': origenDomain,
      'Access-Control-Allow-Headers': 'x-requested-with',
      'Access-Control-Allow-Credentials': true,
    };
  }
}

function connectWebsocket(event: APIGatewayProxyWebsocketEventV2 & APIGatewayProxyEvent): APIGatewayProxyResult {
  const eventHeaders = event?.headers;
  const responseBody = 'Websocket connection was successfully open with ufo';
  return generateResponse(200, responseBody, eventHeaders);
}

// @TODO - message socket - action run-audit

// @TODO - close socket

// @TODO - error socket

export const lambdaHandler = async (
  event: APIGatewayProxyWebsocketEventV2 | (APIGatewayProxyWebsocketEventV2 & APIGatewayProxyEvent),
): Promise<APIGatewayProxyResult> => {
  const routeKey = event.requestContext.routeKey;
  if (routeKey === '$connect') {
    return connectWebsocket(event as APIGatewayProxyWebsocketEventV2 & APIGatewayProxyEvent);
  }

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
