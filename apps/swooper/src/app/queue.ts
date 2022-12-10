import {
	SQSClient,
	ReceiveMessageCommand,
	Message,
	ReceiveMessageCommandInput,
	ReceiveMessageCommandOutput,
	DeleteMessageCommand,
	DeleteMessageCommandInput,
} from '@aws-sdk/client-sqs';
import type {AuditRunParams} from 'shared';
import {environment} from '../environments/environment';

export async function takeNextScheduledAudit(): Promise<AuditRunParams | void> {
	const client = new SQSClient(environment.sqsSchedulerConfig);
	const message = await getAuditFromQueue(client);

	if (!message || !message.ReceiptHandle) return;
	await deleteAuditFromQueue(client, message.ReceiptHandle);

	if (!message.Body) return;
	const body = JSON.parse(message.Body);
	if (body.targetUrl && body.requesterId && body.endpoint) {
		return body as AuditRunParams;
	}
}

async function getAuditFromQueue(client: SQSClient): Promise<Message | void> {
	const input: ReceiveMessageCommandInput = {QueueUrl: process.env.SQS_URL, WaitTimeSeconds: 20};
	const command = new ReceiveMessageCommand(input);
	const response: ReceiveMessageCommandOutput = await client.send(command);
	if (response.Messages && response.Messages[0]) {
		return response.Messages[0];
	}
}

async function deleteAuditFromQueue(client: SQSClient, receiptHandle: Message['ReceiptHandle']): Promise<void> {
	const input: DeleteMessageCommandInput = {QueueUrl: process.env.SQS_URL, ReceiptHandle: receiptHandle};
	const command = new DeleteMessageCommand(input);
	await client.send(command);
}
