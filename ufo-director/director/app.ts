import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// @TODO - generate response method

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
