import { DescribeInstanceStatusCommand, EC2Client, StartInstancesCommand, waitUntilInstanceRunning } from '@aws-sdk/client-ec2';
import { SSMClient, SendCommandCommand } from "@aws-sdk/client-ssm";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const MY_DOMAIN = 'https://deep-blue.io';


const INSTANCE_IDS = ['i-0ac92f269c72da99e'];

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
        body: responseBody,
    };
}

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    let response: APIGatewayProxyResult;
    let responseBody: APIGatewayProxyResult['body'];

    if (!event.body || event.body === "" || event.body === null) {
        return generateResponse(500, ERROR_MESSAGES['001']);
    }

    const target = event.body;

    const client = new EC2Client({ region: "us-east-1" });
    
    const DescCmdParams = { INSTANCE_IDS, DryRun: false }
    const descStatusCmd = new DescribeInstanceStatusCommand(DescCmdParams);
    const descStatusRes = await client.send(descStatusCmd);

    if (descStatusRes.InstanceStatuses?.length) {
        return generateResponse(500, ERROR_MESSAGES['002']);
    }

    try {
        const StartCmdParams = { InstanceIds: INSTANCE_IDS, DryRun: false };
        const startCmd = new StartInstancesCommand(StartCmdParams);
        await client.send(startCmd);

        const waiterParams = { client, maxWaitTime: 120 }
        const instanceRunning = await waitUntilInstanceRunning(waiterParams, StartCmdParams);
    
        if (!instanceRunning) {
            return generateResponse(500, ERROR_MESSAGES['003'])
        }
    } catch (error) {
        return generateResponse(500, ERROR_MESSAGES['004'] + error)
    }

    const SSM = new SSMClient({ region: "us-east-1" });

    const SendCmdCmdParams = {
        DocumentName: 'deepblue_userflow_initiator',
        InstanceIds: ['i-0ac92f269c72da99e'],
        Parameters: { Message: [ target + " " ] }
    }
    
    const sendCmdCmd = new SendCommandCommand(SendCmdCmdParams);
    await SSM.send(sendCmdCmd);
    
    return generateResponse(200, `Runing audit on -> ${target}`);
};
