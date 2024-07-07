import {
  APIGatewayEventWebsocketRequestContextV2,
  APIGatewayProxyEventV2WithRequestContext,
  APIGatewayProxyResult,
  APIGatewayProxyWebsocketEventV2,
} from 'aws-lambda';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { SendCommandCommand, SendCommandCommandOutput, SSMClient } from '@aws-sdk/client-ssm';
import {
  DescribeInstanceStatusCommand,
  DescribeInstanceStatusCommandOutput,
  EC2Client,
  StartInstancesCommand,
  waitUntilInstanceRunning,
} from '@aws-sdk/client-ec2';

import { UfWsRecieveActions } from '@app-speed/shared';

import {
  CONNECTED,
  DISCONNECTED,
  DOCUMENT_NAME,
  GROUP_ID,
  INSTANCE_IDS,
  QUEUE_URL,
  REGION,
  SUCCESS,
} from './constants';
import { generateResponse } from './response';
import { extractAuditDetails } from './audit-details';

function connectWebsocket(
  event: APIGatewayProxyEventV2WithRequestContext<APIGatewayEventWebsocketRequestContextV2>,
): APIGatewayProxyResult {
  return generateResponse(200, CONNECTED, event?.headers);
}

function disconnectWebsocket(
  event: APIGatewayProxyEventV2WithRequestContext<APIGatewayEventWebsocketRequestContextV2>,
): APIGatewayProxyResult {
  return generateResponse(200, DISCONNECTED, event?.headers);
}

async function addAuditToScheduledQueue(auditDetails: object): Promise<void> {
  const client = new SQSClient(REGION);
  const params = { QueueUrl: QUEUE_URL, MessageBody: JSON.stringify(auditDetails), MessageGroupId: GROUP_ID };
  const command = new SendMessageCommand(params);
  await client.send(command);
}

async function getInstanceState(client: EC2Client): Promise<DescribeInstanceStatusCommandOutput> {
  const DescCmdParams = { INSTANCE_IDS, DryRun: false };
  const descStatusCmd = new DescribeInstanceStatusCommand(DescCmdParams);
  return await client.send(descStatusCmd);
}

async function makeInstanceActive(): Promise<void> {
  const client = new EC2Client(REGION);
  const instanceStatus = await getInstanceState(client);
  if (!instanceStatus.InstanceStatuses?.length) {
    await activateInstance(client);
  }
}

async function activateInstance(client: EC2Client): Promise<void> {
  const StartCmdParams = { InstanceIds: INSTANCE_IDS, DryRun: false };
  const startCmd = new StartInstancesCommand(StartCmdParams);
  await client.send(startCmd);
  const WaiterParams = { client, maxWaitTime: 120 };
  await waitUntilInstanceRunning(WaiterParams, StartCmdParams);
  await activateUserFlowConductor();
}

async function activateUserFlowConductor(): Promise<SendCommandCommandOutput> {
  const SSM = new SSMClient(REGION);
  const SendCmdCmdParams = { DocumentName: DOCUMENT_NAME, InstanceIds: INSTANCE_IDS };
  const sendCmdCmd = new SendCommandCommand(SendCmdCmdParams);
  return await SSM.send(sendCmdCmd);
}

async function scheduleAudits(event: APIGatewayProxyWebsocketEventV2): Promise<APIGatewayProxyResult> {
  const auditDetails = extractAuditDetails(event);
  await addAuditToScheduledQueue(auditDetails);
  await makeInstanceActive();
  const runnerResponseMessage: UfWsRecieveActions = {
    type: 'queued',
    payload: SUCCESS(auditDetails.targetUrl),
  };
  return generateResponse(200, JSON.stringify(runnerResponseMessage));
}

export const handler = async (
  event: APIGatewayProxyEventV2WithRequestContext<APIGatewayEventWebsocketRequestContextV2>,
): Promise<APIGatewayProxyResult> => {
  try {
    if (event.requestContext.eventType === 'MESSAGE') {
      if (event.requestContext.routeKey === 'scheduleAudits') {
        return await scheduleAudits(event);
      }
    }
    const eventType = event.requestContext.eventType;
    return eventType === 'CONNECT'
      ? connectWebsocket(event)
      : eventType === 'DISCONNECT'
        ? disconnectWebsocket(event)
        : generateResponse(500, 'Unknown error');
  } catch (error) {
    return generateResponse(500, error as string);
  }
};
