import {SQSClient, ReceiveMessageCommand, ReceiveMessageCommandInput} from '@aws-sdk/client-sqs';
import {AuditRunParams} from './types';

export async function takeNextScheduledAudit(): Promise<AuditRunParams|void> {
  const client = new SQSClient({ region: "us-east-1" });
  const params: ReceiveMessageCommandInput = {
    QueueUrl: "https://sqs.us-east-1.amazonaws.com/495685399379/scheduled-userflows",
    WaitTimeSeconds: 60,
  };

  const command = new ReceiveMessageCommand(params);
  const response = await client.send(command);

  if (response?.Messages && response.Messages[0] && response.Messages[0]?.Body) {
    const nextQueueItem = JSON.parse(response.Messages[0]?.Body);
    if (nextQueueItem?.targetUrl && nextQueueItem?.requesterId && nextQueueItem?.endpoint) {
      return nextQueueItem;
    }
  }
}