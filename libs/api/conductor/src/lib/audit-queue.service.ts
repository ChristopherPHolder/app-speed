import { Injectable, Logger } from '@nestjs/common';
import { Schema } from 'effect';
import { ReplayUserflowAuditSchema } from '@app-speed/shared-user-flow-replay/schema';

type AuditDetails = {
  id: string;
  details: any;
};

@Injectable()
export class AuditQueueService {
  readonly #logger = new Logger(AuditQueueService.name);
  readonly #queue: AuditDetails[] = [];

  enqueue(auditDetails: AuditDetails): void {
    this.#queue.push(auditDetails);
    this.#logger.log(`Item added to queue. Current size: ${this.size()}`);
  }

  dequeue(): AuditDetails | undefined {
    const nextItem = this.#queue.shift();
    if (nextItem) {
      this.#logger.log(`Item dequeued. Current length: ${this.#queue.length}`);
    } else {
      this.#logger.warn('Attempted to dequeue but the queue is empty.');
    }
    return nextItem;
  }

  peek(): AuditDetails | undefined {
    return this.#queue[0];
  }

  size(): number {
    return this.#queue.length;
  }

  list(): AuditDetails[] {
    return this.#queue;
  }

  isEmpty(): boolean {
    return this.#queue.length === 0;
  }

  clearQueue(): void {
    this.#queue.length = 0;
    this.#logger.log('Queue cleared.');
  }
}
