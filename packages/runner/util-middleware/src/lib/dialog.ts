import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { StageChangeMessage, CONDUCTOR_STAGE } from '@app-speed/shared/websocket-message-util-lib';

export async function sendAuditResults(connectionId: string, endpoint: string, resultsKey: string): Promise<void> {
  const responseData: StageChangeMessage = {
    type: 'stage-change',
    stage: CONDUCTOR_STAGE.DONE,
    key: resultsKey,
  };

  await sendMessageToRequestor(responseData, connectionId, endpoint);
}

export async function informAuditItRunning(connectionId: string, endpoint: string) {
  const responseData: StageChangeMessage = {
    type: 'stage-change',
    stage: CONDUCTOR_STAGE.RUNNING,
  };

  await sendMessageToRequestor(responseData, connectionId, endpoint);
}

export async function informAuditError(connectionId: string, endpoint: string) {
  const responseData: StageChangeMessage = {
    type: 'stage-change',
    stage: CONDUCTOR_STAGE.FAILED,
  };

  await sendMessageToRequestor(responseData, connectionId, endpoint);
}

async function sendMessageToRequestor(message: StageChangeMessage, connectionId: string, endpoint: string) {
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
