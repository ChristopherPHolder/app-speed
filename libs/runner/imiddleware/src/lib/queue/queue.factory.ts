import { AuditQueue } from '@app-speed/runner-interfaces';
import { AwsSqs, LocalQueue } from '@app-speed/runner-data-access-queue';

const queueMap = {
  local: LocalQueue,
  sqs: AwsSqs,
} as const;

type QueueKeys = keyof typeof queueMap;

function isInQueueMap(queue: string): queue is QueueKeys {
  return Object.keys(queueMap).includes(queue);
}

export function createAuditQueue(queue: string, config?: object): AuditQueue {
  if (!isInQueueMap(queue)) {
    throw new Error('Invalid queue option passed, passed ' + queue + 'but only accepts' + Object.keys(queueMap));
  }
  const Queue = queueMap[queue];
  return new Queue(config as any) satisfies AuditQueue;
}
