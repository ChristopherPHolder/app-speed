import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  APIGatewayProxyWebsocketEventV2,
  APIGatewayProxyEventV2WithRequestContext,
  APIGatewayEventWebsocketRequestContextV2,
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

import { AuditRunParams } from '../../types';

const INSTANCE_IDS = ['i-0ac92f269c72da99e'];
const QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/495685399379/ScheduledUserflows.fifo';
const REGION = { region: 'us-east-1' };

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

function connectWebsocket(
  event: APIGatewayProxyEventV2WithRequestContext<APIGatewayEventWebsocketRequestContextV2>,
): APIGatewayProxyResult {
  const eventHeaders = event?.headers;
  const responseBody = 'Websocket connection was successfully open with ufo';
  return generateResponse(200, responseBody, eventHeaders);
}

function disconnectWebsocket(
  event: APIGatewayProxyEventV2WithRequestContext<APIGatewayEventWebsocketRequestContextV2>,
): APIGatewayProxyResult {
  const eventHeaders = event?.headers;
  const responseBody = 'Websocket connection was successfully closed with ufo';
  return generateResponse(200, responseBody, eventHeaders);
}

function extractAuditDetails(event: APIGatewayProxyWebsocketEventV2): AuditRunParams {
  if (!event?.body || event.body === '') {
    throw new Error('Error: event body seems to have an issue');
  }
  const body = JSON.parse(event.body);
  if (!body?.targetUrl) {
    throw new Error('Error: event body is missing the target url');
  }
  return {
    targetUrl: body.targetUrl,
    requesterId: event.requestContext.connectionId,
    endpoint: `https://${event.requestContext.domainName}/${event.requestContext.stage}`,
  };
}

async function addAuditToScheduledQueue(auditDetails: object): Promise<void> {
  const client = new SQSClient(REGION);
  const params = {
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify(auditDetails),
    MessageGroupId: 'scheduled-audit',
  };
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
  const SendCmdCmdParams = {
    DocumentName: 'deepblue_userflow_initiator',
    InstanceIds: INSTANCE_IDS,
  };
  const sendCmdCmd = new SendCommandCommand(SendCmdCmdParams);
  return await SSM.send(sendCmdCmd);
}

async function scheduleAudits(event: APIGatewayProxyWebsocketEventV2): Promise<APIGatewayProxyResult> {
  const auditDetails = extractAuditDetails(event);
  await addAuditToScheduledQueue(auditDetails);
  await makeInstanceActive();
  const responseData = JSON.stringify({
    action: 'scheduled',
    message: `Successfully scheduled audit for ${auditDetails.targetUrl}`,
  });
  return generateResponse(200, responseData);
}

// @TODO - error socket

export const lambdaHandler = async (
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
