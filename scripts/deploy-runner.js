const {
  EC2Client,
  DescribeInstanceStatusCommand,
  StartInstancesCommand,
  waitUntilInstanceRunning,
  StopInstancesCommand
} = require('@aws-sdk/client-ec2');

const {
  SSMClient,
  SendCommandCommand,
  waitUntilCommandExecuted
} = require('@aws-sdk/client-ssm');

const REGION = { region: 'us-east-1' };
const INSTANCE_IDS = ['i-0781d8307e3c9e9f7'];
const DOCUMENT_NAME = 'ufo-runner-deploy';

(async () => {
  console.log('Running deployment script for runner app');
  const ec2Client = await makeInstanceActive();
  await runDeploymentDocumentCommand();
  await stopInstanceCommand(ec2Client);
})();

async function stopInstanceCommand(ec2Client) {
  const command = new StopInstancesCommand({InstanceIds: INSTANCE_IDS});
  await ec2Client.send(command);
  console.log('Stopping instance')
}

async function runDeploymentDocumentCommand() {
  console.log('Sending SSM Deployment Command Command');
  const SSM = new SSMClient(REGION);
  const SendCmdCmdParams = {
    DocumentName: DOCUMENT_NAME,
    InstanceIds: INSTANCE_IDS,
  };
  const sendCmdCmd = new SendCommandCommand(SendCmdCmdParams);
  const ssmResponse = await SSM.send(sendCmdCmd);
  console.log('Received command response');
  await waitForDeploymentCommand(SSM, ssmResponse)
}

async function waitForDeploymentCommand(client, ssmRes) {
  const params = {
    client,
    maxWaitTime: 600
  };
  const input  = {
    CommandId: ssmRes.Command.CommandId,
    InstanceId: ssmRes.Command.InstanceIds[0]
  }
  await waitUntilCommandExecuted(params, input)
  console.log('Completed SSM Deployment Command Command');
}

async function makeInstanceActive() {
  console.log('Activating runner Instance initiated');
  const client = new EC2Client(REGION);
  const instanceStatus = await getInstanceState(client);
  if (!instanceStatus.InstanceStatuses?.length) {
    await activateInstance(client);
  }
  console.log('Activating runner Instance initiated');
  return client;
}

async function getInstanceState(client) {
  const DescCmdParams = { INSTANCE_IDS, DryRun: false };
  const descStatusCmd = new DescribeInstanceStatusCommand(DescCmdParams);
  return await client.send(descStatusCmd);
}

async function activateInstance(client) {
  const StartCmdParams = { InstanceIds: INSTANCE_IDS, DryRun: false };
  const startCmd = new StartInstancesCommand(StartCmdParams);
  await client.send(startCmd);
  const WaiterParams = { client, maxWaitTime: 120 };
  await waitUntilInstanceRunning(WaiterParams, StartCmdParams);
}
