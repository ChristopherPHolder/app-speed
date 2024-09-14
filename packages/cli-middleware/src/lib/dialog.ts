import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';

export async function sendAuditResults(connectionId: string, endpoint: string, resultsKey: string): Promise<void> {
  const responseData = {
    type: 'stage-change',
    stage: 'done',
    key: resultsKey,
  };

  await sendMessageToRequestor(responseData, connectionId, endpoint);
}

export async function informAuditItRunning(connectionId: string, endpoint: string) {
  const responseData = {
    type: 'stage-change',
    stage: 'running',
  };

  await sendMessageToRequestor(responseData, connectionId, endpoint);
}

export async function informAuditError(connectionId: string, endpoint: string) {
  const responseData = {
    type: 'stage-change',
    stage: 'failed',
  };

  await sendMessageToRequestor(responseData, connectionId, endpoint);
}

async function sendMessageToRequestor(message: object, connectionId: string, endpoint: string) {
  const client = new ApiGatewayManagementApiClient({
    region: 'us-east-1',
    endpoint: endpoint,
  });

  const command: PostToConnectionCommand = new PostToConnectionCommand({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    Data: JSON.stringify(message),
    ConnectionId: connectionId,
  });

  await client.send(command);
}
