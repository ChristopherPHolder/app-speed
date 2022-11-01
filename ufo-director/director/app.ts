import { APIGatewayProxyResult, APIGatewayProxyEvent, APIGatewayProxyWebsocketEventV2 } from 'aws-lambda';
import { SendMessageCommand, SendMessageCommandOutput, SQSClient } from '@aws-sdk/client-sqs';
import { SSMClient, SendCommandCommand } from '@aws-sdk/client-ssm';
import {
  EC2Client,
  DescribeInstanceStatusCommand,
  DescribeInstanceStatusCommandOutput,
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

function connectWebsocket(event: APIGatewayProxyWebsocketEventV2 & APIGatewayProxyEvent): APIGatewayProxyResult {
  const eventHeaders = event?.headers;
  const responseBody = 'Websocket connection was successfully open with ufo';
  return generateResponse(200, responseBody, eventHeaders);
}

function extractTargetDetails(event: APIGatewayProxyWebsocketEventV2): string {
  // @TODO -- verify uber check is necessary
  if (!event.body || event.body === '' || event.body === null) {
    throw new Error('Error: event body seems to have an issue');
  }
  return event.body;
}

async function addAuditToScheduledQueue(target: string): Promise<SendMessageCommandOutput> {
  const client = new SQSClient(REGION);
  const params = { MessageBody: target, QueueUrl: QUEUE_URL };
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
  const target = extractTargetDetails(event);
  await addAuditToScheduledQueue(target);
  await makeInstanceActive();
  return generateResponse(200, `Successfully scheduled audit for ${target}`);
}

// @TODO - close socket

// @TODO - error socket

export const lambdaHandler = async (
  event: APIGatewayProxyWebsocketEventV2 | (APIGatewayProxyWebsocketEventV2 & APIGatewayProxyEvent),
): Promise<APIGatewayProxyResult> => {
  const routeKey = event.requestContext.routeKey;
  try {
    if (routeKey === '$connect') {
      return connectWebsocket(event as APIGatewayProxyWebsocketEventV2 & APIGatewayProxyEvent);
    } else if (routeKey === 'scheduleAudits') {
      return scheduleAudits(event as APIGatewayProxyWebsocketEventV2);
    }
  } catch (error) {
    return generateResponse(500, error as string);
  }
  return generateResponse(500, 'Unknown error');
};
