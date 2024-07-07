import { APIGatewayProxyResult, Handler } from 'aws-lambda';

export const handler: Handler = async (): Promise<APIGatewayProxyResult> => {
  let response: APIGatewayProxyResult;
  try {
    response = {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'x-requested-with',
        'Access-Control-Allow-Credentials': true,
      },
      statusCode: 200,
      body: '1',
    };
  } catch (error) {
    console.log(error);
    response = {
      statusCode: 500,
      body: JSON.stringify({
        message: `Error: ${error}`,
      }),
    };
  }

  return response;
};
