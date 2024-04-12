import { describe, expect, it } from 'vitest';
import { createAuditQueue } from './queue.factory';
import { AuditQueue } from '@ufo/cli-interfaces';

describe('queue factory', async () => {
  let queue: AuditQueue;

  it('should load local queue', async () => {
    queue = await createAuditQueue('local');
    expect(queue).toBeTruthy();
    expect(queue.nextItem).toBeTruthy();
    expect(typeof queue.nextItem).toBe('function');
  });

  it('should load aws-sqs queue', async () => {
    queue = await createAuditQueue('sqs');
    expect(queue).toBeTruthy();
    expect(queue.nextItem).toBeTruthy();
    expect(typeof queue.nextItem).toBe('function');
  });
})
