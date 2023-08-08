import {describe, it } from 'vitest';
import { createAuditQueue } from './queue.factory';

describe('queue factory', async () => {
  it('should not throw', async () => {
    await createAuditQueue('@ufo/audit-queue/local-queue');
  });
})
