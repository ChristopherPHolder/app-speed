import {ApiGatewayManagementApiClient, PostToConnectionCommand} from '@aws-sdk/client-apigatewaymanagementapi';
import type {RunnerResponseMessage} from 'shared';

import { Reports } from 'shared';

export async function sendAuditResults(connectionId: string, endpoint: string, resultsUrl: string,): Promise<void> {
  const reports: Reports = {
    htmlReportUrl: resultsUrl
  };
  const SUCCESSFUL_AUDIT_MSG = 'Successfully completed the User Flow Audit';
  const responseData: RunnerResponseMessage = {
    action: 'done',
    message: SUCCESSFUL_AUDIT_MSG,
    reports: reports
  };

  const client = new ApiGatewayManagementApiClient({
    region: 'us-east-1',
    endpoint: endpoint
  });


  const command = new PostToConnectionCommand({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    Data: JSON.stringify(responseData),
    ConnectionId: connectionId
  });

  await client.send(command);
}
