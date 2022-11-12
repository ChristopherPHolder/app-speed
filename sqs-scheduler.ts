import type {ReceiveMessageCommandInput} from '@aws-sdk/client-sqs';
import {SQSClient, ReceiveMessageCommand} from '@aws-sdk/client-sqs';
import type {AuditRunParams} from './types';
import {SQS_SCHEDULER_CONFIG} from "./constants";

export async function takeNextScheduledAudit(): Promise<AuditRunParams | void> {
	const client = new SQSClient(SQS_SCHEDULER_CONFIG);
	const params: ReceiveMessageCommandInput = {QueueUrl: process.env.SQS_URL, WaitTimeSeconds: 20};
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
