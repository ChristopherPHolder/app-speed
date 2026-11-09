import { EC2Client, DescribeInstancesCommand, DescribeInstanceStatusCommand } from '@aws-sdk/client-ec2';

interface Ec2StatusOptions {
  region: string;
  instanceId: string;
}

export default async function ec2Status(options: Ec2StatusOptions) {
  const client = new EC2Client({ region: options.region });
  const [instances, health] = await Promise.all([
    client.send(new DescribeInstancesCommand({ InstanceIds: [options.instanceId] })),
    client.send(new DescribeInstanceStatusCommand({ InstanceIds: [options.instanceId], IncludeAllInstances: true })),
  ]);
  const instance = instances.Reservations?.flatMap((reservation) => reservation.Instances ?? []).find(
    (instance) => instance.InstanceId === options.instanceId,
  );
  if (!instance) throw new Error(`Instance ${options.instanceId} was not found.`);
  const status = health.InstanceStatuses?.find((instance) => instance.InstanceId === options.instanceId);
  console.info(
    JSON.stringify({
      instanceId: options.instanceId,
      state: instance.State?.Name,
      transitionReason: instance.StateTransitionReason,
      stateReason: instance.StateReason?.Message,
      systemStatus: status?.SystemStatus?.Status,
      instanceStatus: status?.InstanceStatus?.Status,
      scheduledEvents: status?.Events?.map((event) => ({ code: event.Code, description: event.Description })),
    }),
  );
  return { success: true };
}
