import {
  DeleteMessageCommand,
  DeleteMessageCommandInput,
  ReceiveMessageCommand,
  ReceiveMessageCommandInput,
  ReceiveMessageCommandOutput,
  SQSClient,
  SQSClientConfig,
} from '@aws-sdk/client-sqs';

import { Message } from '@aws-sdk/client-sqs/dist-types/models/models_0';
import { AuditQueue, AuditRunParams } from 'shared';

type SQSConfig = {
  region: string;
  url: string;
}

export class AwsSqs implements AuditQueue {

  private sqsClient!: SQSClient;
  private config: SQSConfig;

  constructor(config: SQSConfig) {
    this.config = config;
    const sqsClientConfig:  SQSClientConfig = {region: config.region};
    this.sqsClient = new SQSClient(sqsClientConfig);
  }

  private async receiveMessage(): Promise<Message | void> {
    const input: ReceiveMessageCommandInput = { QueueUrl: this.config.url, WaitTimeSeconds: 5 };
    const command: ReceiveMessageCommand = new ReceiveMessageCommand(input);
    const response: ReceiveMessageCommandOutput = await this.sqsClient.send(command);
    if (response.Messages && response.Messages[0]) {
      return response.Messages[0];
    }
  }
  private async deleteMessage(receiptHandle: Message['ReceiptHandle']) {
    const input: DeleteMessageCommandInput = { QueueUrl: this.config.url, ReceiptHandle: receiptHandle };
    const command = new DeleteMessageCommand(input);
    return await this.sqsClient.send(command);
  }

  private isValidAuditParams(message: any): message is AuditRunParams {
    return 'requesterId' in message;
  }

  async nextItem(): Promise<AuditRunParams | void> {
    const message = await this.receiveMessage();
    if (!message) {
      return;
    }
    await this.deleteMessage(message.ReceiptHandle);

    if (!this.isValidAuditParams(message)) {
      console.error('Invalid Audit Params in Queue', message);
      return await this.nextItem();
    }
    return message;
  }
}

export default AwsSqs;
