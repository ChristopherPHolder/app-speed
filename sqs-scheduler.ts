import { SQSClient, ReceiveMessageCommand } from '@aws-sdk/client-sqs';

export async function takeNextScheduledAudit(): Promise<string|void> {
  
  const client = new SQSClient({ region: "us-east-1" });
  const params = {
    QueueUrl: "https://sqs.us-east-1.amazonaws.com/495685399379/scheduled-userflows"
  };

  const command = new ReceiveMessageCommand(params);
  const response = await client.send(command);

  if (response?.Messages && response.Messages[0] && response.Messages[0]?.Body) {
    return response.Messages[0]?.Body
  }
}