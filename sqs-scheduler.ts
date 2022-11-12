import {
	SQSClient,
	ReceiveMessageCommand,
	ReceiveMessageCommandInput,
	ReceiveMessageCommandOutput,
	DeleteMessageCommand,
	DeleteMessageCommandInput
} from '@aws-sdk/client-sqs';
import type {AuditRunParams} from './types';
import {SQS_SCHEDULER_CONFIG} from "./constants";

export async function takeNextScheduledAudit(): Promise<AuditRunParams | void> {
	const client = new SQSClient(SQS_SCHEDULER_CONFIG);
	const params: ReceiveMessageCommandInput = {QueueUrl: process.env.SQS_URL, WaitTimeSeconds: 20};
	const command = new ReceiveMessageCommand(params);
	const response: ReceiveMessageCommandOutput = await client.send(command);

	await deleteAuditFromQueue(client, response);

	if (response?.Messages && response.Messages[0] && response.Messages[0]?.Body) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const nextQueueItem = JSON.parse(response.Messages[0]?.Body);
		if (nextQueueItem?.targetUrl && nextQueueItem?.requesterId && nextQueueItem?.endpoint) {
			return nextQueueItem as AuditRunParams;
		}
	}
}

async function deleteAuditFromQueue(client: SQSClient, receiveMessageResponse: ReceiveMessageCommandOutput): Promise<void> {
	if (!receiveMessageResponse.Messages ||
		!receiveMessageResponse.Messages[0] ||
		!receiveMessageResponse.Messages[0].ReceiptHandle
	) {
		return;
	}
	const receiptHandle = receiveMessageResponse.Messages[0].ReceiptHandle;
	const input: DeleteMessageCommandInput = {QueueUrl: process.env.SQS_URL, ReceiptHandle: receiptHandle};
	const command = new DeleteMessageCommand(input);
	await client.send(command);
}