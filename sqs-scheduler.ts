import { SQSClient, ReceiveMessageCommand, ReceiveMessageCommandOutput } from '@aws-sdk/client-sqs';

export async function takeNextScheduledAudit(): Promise<string | undefined> {
  
  const client = new SQSClient({ region: "us-east-1" });
  const params = {
    QueueUrl: "https://sqs.us-east-1.amazonaws.com/495685399379/scheduled-userflows"
  };

  const command = new ReceiveMessageCommand(params);
  const response = await new Promise<ReceiveMessageCommandOutput>(async (resolve) => {
      resolve(await client.send(command))
  });

  if (response.Messages) {
    return response.Messages[0]?.Body
  }
}