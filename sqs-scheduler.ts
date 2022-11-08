import type {ReceiveMessageCommandInput} from '@aws-sdk/client-sqs';
import {SQSClient, ReceiveMessageCommand} from '@aws-sdk/client-sqs';
import type {AuditRunParams} from './types';

export async function takeNextScheduledAudit(): Promise<AuditRunParams | void> {
	const client = new SQSClient({region: 'us-east-1'});
	const queueUrl = 'https://sqs.us-east-1.amazonaws.com/495685399379/scheduled-userflows';
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const params: ReceiveMessageCommandInput = {QueueUrl: queueUrl, WaitTimeSeconds: 20};
	const command = new ReceiveMessageCommand(params);
	const response = await client.send(command);

	if (response?.Messages && response.Messages[0] && response.Messages[0]?.Body) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const nextQueueItem = JSON.parse(response.Messages[0]?.Body);
		if (nextQueueItem?.targetUrl && nextQueueItem?.requesterId && nextQueueItem?.endpoint) {
			return nextQueueItem as AuditRunParams;
		}
	}
}
