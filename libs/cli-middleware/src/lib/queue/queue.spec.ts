import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { join } from 'path';
import { writeFileSync, rmSync, mkdirSync } from 'fs';

import { createAuditQueue } from './queue.factory';

describe('queue factory', async () => {
  const mockPath = './src/lib/queue/mock-data';

  beforeAll(() => {
    mkdirSync(mockPath);
    writeFileSync(join(mockPath, 'mock-audit.json'), '{ "audit": "mock-audit" }');
  })

  afterAll(() => rmSync(mockPath, {recursive: true}));

  it('should load local audit', async () => {
    const queue = await createAuditQueue('@ufo/audit-queue/local-queue', { path: './src/lib/queue/mock-data' });

    const firstItem = await queue.nextItem();
    expect(firstItem).toBeTruthy();

    const secondItem = await queue.nextItem();
    expect(secondItem).toBeFalsy();
  });
})
