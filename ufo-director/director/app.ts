import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  APIGatewayProxyWebsocketEventV2,
  APIGatewayProxyEventV2WithRequestContext,
  APIGatewayEventWebsocketRequestContextV2,
} from 'aws-lambda';
import { SendMessageCommand, SendMessageCommandOutput, SQSClient } from '@aws-sdk/client-sqs';
import { SendCommandCommand, SSMClient } from '@aws-sdk/client-ssm';
import {
  DescribeInstanceStatusCommand,
  DescribeInstanceStatusCommandOutput,
  EC2Client,
  StartInstancesCommand,
  waitUntilInstanceRunning,
} from '@aws-sdk/client-ec2';

const INSTANCE_IDS = ['i-0ac92f269c72da99e'];
const QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/495685399379/scheduled-userflows';
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

type AuditRunParams = {
  targetUrl: URL;
  requesterId: string;
} & { [prop: string]: string };

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
  };
}

async function addAuditToScheduledQueue(auditDetails: object): Promise<SendMessageCommandOutput> {
  const client = new SQSClient(REGION);
  const params = { MessageBody: JSON.stringify(auditDetails), QueueUrl: QUEUE_URL };
  const command = new SendMessageCommand(params);
  return await client.send(command);
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

async function activateUserFlowConductor() {
  const SSM = new SSMClient(REGION);
  const SendCmdCmdParams = {
    DocumentName: 'deepblue_userflow_initiator',
    InstanceIds: INSTANCE_IDS,
  };
  const sendCmdCmd = new SendCommandCommand(SendCmdCmdParams);
  await SSM.send(sendCmdCmd);
}

async function scheduleAudits(event: APIGatewayProxyWebsocketEventV2): Promise<APIGatewayProxyResult> {
  const auditDetails = extractAuditDetails(event);
  await addAuditToScheduledQueue(auditDetails);
  await makeInstanceActive();
  return generateResponse(200, `Successfully scheduled audit for ${auditDetails}`);
}

// @TODO - close socket

// @TODO - error socket

export const lambdaHandler = async (
  event: APIGatewayProxyEventV2WithRequestContext<APIGatewayEventWebsocketRequestContextV2>,
): Promise<APIGatewayProxyResult> => {
  try {
    if (event.requestContext.eventType === 'CONNECT') {
      return connectWebsocket(event);
    }
    if (event.requestContext.eventType === 'MESSAGE') {
      if (event.requestContext.routeKey === 'scheduleAudits') {
        return scheduleAudits(event as APIGatewayProxyWebsocketEventV2);
      }
    }
  } catch (error) {
    return generateResponse(500, error as string);
  }
  return generateResponse(500, 'Unknown error');
};
