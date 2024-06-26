import {ApiGatewayManagementApiClient, PostToConnectionCommand} from '@aws-sdk/client-apigatewaymanagementapi';
import type {UfWsActions} from '@app-speed/shared';
import { Reports } from '@app-speed/shared';

export async function sendAuditResults(connectionId: string, endpoint: string, resultsUrl: string,): Promise<void> {
  const reports: Reports = {
    htmlReportUrl: resultsUrl
  };

  const responseData: UfWsActions = {
    type: 'done',
    payload: reports
  };

  const client: ApiGatewayManagementApiClient = new ApiGatewayManagementApiClient({
    region: 'us-east-1',
    endpoint: endpoint
  });


  const command: PostToConnectionCommand = new PostToConnectionCommand({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    Data: JSON.stringify(responseData),
    ConnectionId: connectionId
  });

  await client.send(command);
}
