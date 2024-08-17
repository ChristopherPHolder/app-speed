import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';

export async function sendAuditResults(connectionId: string, endpoint: string, resultsKey: string): Promise<void> {
  const responseData = {
    type: 'done',
    key: resultsKey,
  };

  const client: ApiGatewayManagementApiClient = new ApiGatewayManagementApiClient({
    region: 'us-east-1',
    endpoint: endpoint,
  });

  const command: PostToConnectionCommand = new PostToConnectionCommand({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    Data: JSON.stringify(responseData),
    ConnectionId: connectionId,
  });

  await client.send(command);
}
