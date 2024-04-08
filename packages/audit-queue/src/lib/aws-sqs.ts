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
import { AuditQueue } from '@app-speed/cli-interfaces';
import { AuditRunParams } from '@app-speed/shared';

type SQSConfig = {
  region: string;
  url: string;
}

export class AwsSqs implements AuditQueue {

  private sqsClient!: SQSClient;
  private config: SQSConfig;
  private defaultConfig: SQSConfig = {
    region: 'us-east-1',
    url: 'https://sqs.us-east-1.amazonaws.com/495685399379/ScheduledUserflows.fifo',
  };

  constructor(config: SQSConfig) {
    this.config = config || this.defaultConfig;
    const sqsClientConfig:  SQSClientConfig = {region: this.config.region};
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

  private isValidAuditParams(message: object): message is AuditRunParams {
    return 'requesterId' in message;
  }

  async nextItem(): Promise<AuditRunParams | void> {
    const message = await this.receiveMessage();
    if (!message) {
      return;
    }
    await this.deleteMessage(message.ReceiptHandle);

    if (!message.Body) {
      console.error('Invalid SQS Message, it missing body!');
      return await this.nextItem();
    }

    const auditParams = JSON.parse(message.Body);

    if (!this.isValidAuditParams(auditParams)) {
      console.error('Invalid Audit Params in Queue', message);
      return await this.nextItem();
    }
    return auditParams;
  }
}

export default AwsSqs;
