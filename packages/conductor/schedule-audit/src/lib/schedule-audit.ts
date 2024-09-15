import { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from 'aws-lambda';
import {
  RESPONSE_SUCCESSFUL,
  RESPONSE_SERVER_ERROR,
  extractedError,
  formatedResponse,
} from '@app-speed/conductor/shared-util-lib';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import {
  DescribeInstanceStatusCommand,
  DescribeInstanceStatusCommandOutput,
  EC2Client,
  StartInstancesCommand,
  waitUntilInstanceRunning,
} from '@aws-sdk/client-ec2';
import { SendCommandCommand, SendCommandCommandOutput, SSMClient } from '@aws-sdk/client-ssm';
import { CONDUCTOR_STAGE, StageChangeMessage } from '@app-speed/shared/websocket-message-util-lib';

const INSTANCE_IDS = ['i-0781d8307e3c9e9f7'];
const REGION = { region: 'us-east-1' };
const QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/495685399379/ScheduledUserflows.fifo';
const DOCUMENT_NAME = 'deepblue_userflow_initiator';
const GROUP_ID = 'scheduled-audit';

type AuditRequest = {
  audit: any;
};

async function activateUserFlowConductor(): Promise<SendCommandCommandOutput> {
  console.log('going to run ssm');
  const SSM = new SSMClient(REGION);
  const SendCmdCmdParams = { DocumentName: DOCUMENT_NAME, InstanceIds: INSTANCE_IDS };
  const sendCmdCmd = new SendCommandCommand(SendCmdCmdParams);
  const response = await SSM.send(sendCmdCmd);
  console.log('SSM SEND RESPONSE', response);
  return response;
}

async function activateInstance(client: EC2Client): Promise<void> {
  const StartCmdParams = { InstanceIds: INSTANCE_IDS, DryRun: false };
  const startCmd = new StartInstancesCommand(StartCmdParams);
  await client.send(startCmd);
  console.log('Send to activate');
  const WaiterParams = { client, maxWaitTime: 120 };
  await waitUntilInstanceRunning(WaiterParams, StartCmdParams);
  console.log('waited to instance active');

  await activateUserFlowConductor();
  console.log('waited to run command');
}

async function makeInstanceActive(): Promise<void> {
  const client = new EC2Client(REGION);
  const instanceStatus = await getInstanceState(client);
  if (!instanceStatus.InstanceStatuses?.length) {
    await activateInstance(client);
  }
}

async function getInstanceState(client: EC2Client): Promise<DescribeInstanceStatusCommandOutput> {
  const DescCmdParams = { INSTANCE_IDS, DryRun: false };
  const descStatusCmd = new DescribeInstanceStatusCommand(DescCmdParams);
  return await client.send(descStatusCmd);
}

async function addAuditToScheduledQueue(auditDetails: object): Promise<void> {
  const client = new SQSClient(REGION);
  const params = { QueueUrl: QUEUE_URL, MessageBody: JSON.stringify(auditDetails), MessageGroupId: GROUP_ID };
  const command = new SendMessageCommand(params);
  await client.send(command);
}

function formattedAuditRequest(event: APIGatewayProxyEvent) {
  if (!event?.body || event.body === '') {
    throw new Error('Error: event body seems to have an issue');
  }
  const { audit }: AuditRequest = JSON.parse(event.body);
  return {
    targetUrl: audit, // TODO this should probably be renamed!
    requesterId: event.requestContext.connectionId,
    endpoint: `https://${event.requestContext.domainName}/${event.requestContext.stage}`,
  };
}

export const handler: Handler<APIGatewayProxyEvent, APIGatewayProxyResult> = async (event) => {
  try {
    const { domainName } = event.requestContext;
    console.log('domainName', domainName);
    const auditRequest = formattedAuditRequest(event);
    console.log('auditRequest', auditRequest);

    await addAuditToScheduledQueue(auditRequest);
    console.log('added to the queue');

    await makeInstanceActive(); // TODO Should be a separate function invoked by adding an item to the QUEUE

    const responseBody: StageChangeMessage = {
      type: 'stage-change',
      stage: CONDUCTOR_STAGE.SCHEDULED,
    };

    return formatedResponse(RESPONSE_SUCCESSFUL.OK, JSON.stringify(responseBody), domainName);
  } catch (error: unknown) {
    console.error(error);
    return formatedResponse(RESPONSE_SERVER_ERROR.INTERNAL_SERVER_ERROR, extractedError(error));
  }
};
