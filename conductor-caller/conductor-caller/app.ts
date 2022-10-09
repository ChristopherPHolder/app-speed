import {
    EC2Client, 
    DescribeInstanceStatusCommand,
    DescribeInstanceStatusCommandOutput,
    StartInstancesCommand,
    waitUntilInstanceRunning
} from '@aws-sdk/client-ec2';
import { 
    SSMClient, 
    SendCommandCommand
} from "@aws-sdk/client-ssm";
import { 
    SQSClient, 
    SendMessageCommand, 
    SendMessageCommandOutput 
} from '@aws-sdk/client-sqs';
import {
    APIGatewayProxyEvent,
    APIGatewayProxyResult
} from 'aws-lambda';

const MY_DOMAIN = 'https://deep-blue.io';

const INSTANCE_IDS = ['i-0ac92f269c72da99e'];
const QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/495685399379/scheduled-userflows"
const REGION = { region: "us-east-1" };

const ERROR_MESSAGES: Record<string, string> = {
    '001': 'Error_001: No target was found in request',
    '002': 'Error_002: Instance is already running, and was not able to handle scheduling at the moment',
    '003': 'Error_003: instance did not start in 120 seconds',
    '004': 'Error_004: Not able to start instance for unnkown reason\n',
}

function generateResponse(
    responseCode: APIGatewayProxyResult['statusCode'],
    responseBody: APIGatewayProxyResult['body']
): APIGatewayProxyResult {
    return {
        statusCode: responseCode,
        headers: {
            'Access-Control-Allow-Origin': MY_DOMAIN,
            'Access-Control-Allow-Headers': 'x-requested-with',
            'Access-Control-Allow-Credentials': true,
        },
        body: responseBody
    };
}

function extractTargetDetails(event: APIGatewayProxyEvent): string {
    if (!event.body || event.body === "" || event.body === null) {
        throw new Error(ERROR_MESSAGES['001']);
    }
    return event.body;
};

async function addAuditToSchuledQueue(target: string): Promise<SendMessageCommandOutput> {
    const client = new SQSClient(REGION);
    const params = { MessageBody: target, QueueUrl: QUEUE_URL }
    const command = new SendMessageCommand(params);
    return await client.send(command);
}

async function makeInstanceActive(): Promise<void> {
    const client = new EC2Client(REGION);
    const instanceStatus = await getInstanceState(client);
    if (!instanceStatus.InstanceStatuses?.length) {
        await activateInstance(client);
    }
}

async function getInstanceState(client: EC2Client): Promise<DescribeInstanceStatusCommandOutput> {
    const DescCmdParams = { INSTANCE_IDS, DryRun: false }
    const descStatusCmd = new DescribeInstanceStatusCommand(DescCmdParams);
    return await client.send(descStatusCmd);
}

async function activateInstance(client: EC2Client): Promise<void> {
    const StartCmdParams = { InstanceIds: INSTANCE_IDS, DryRun: false };
    const startCmd = new StartInstancesCommand(StartCmdParams);
    await client.send(startCmd);
    const WaiterParams = { client, maxWaitTime: 120 }
    await waitUntilInstanceRunning(WaiterParams, StartCmdParams);
    await activateUserflowConductor();
    // TODO (handle error because !instance -> ERROR_MESSAGES['003'])
}

async function activateUserflowConductor() {
    const SSM = new SSMClient(REGION);
    const SendCmdCmdParams = {
        DocumentName: 'deepblue_userflow_initiator',
        InstanceIds: INSTANCE_IDS,
    }
    const sendCmdCmd = new SendCommandCommand(SendCmdCmdParams);
    await SSM.send(sendCmdCmd);
}

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const target = extractTargetDetails(event);
        await addAuditToSchuledQueue(target);
        await makeInstanceActive();
        return generateResponse(200, `Successfully scheduled audit for ${target}`);
    } catch (error) {
        return generateResponse(500, error as string);
    };
};
