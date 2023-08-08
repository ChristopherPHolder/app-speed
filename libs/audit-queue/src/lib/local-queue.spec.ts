import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { join } from 'path';
import { writeFileSync, rmSync, mkdirSync } from 'fs';

import { LocalQueue, LocalQueueConfig } from './local-queue';

describe('local queue', async () => {
  const mockPath =  './src/lib/mock-data';

  beforeAll(() => {
    console.info('CWD', )
    mkdirSync(mockPath);
    writeFileSync(join(mockPath, 'mock-audit.json'), '{ "audit": "mock-audit" }');
  })

  afterAll(() => rmSync(mockPath, {recursive: true}));

  it('should load local audit', async () => {
    const config: LocalQueueConfig = { path: mockPath }
    const queue = new LocalQueue(config);

    const firstItem = await queue.nextItem();
    expect(firstItem).toBeTruthy();

    const secondItem = await queue.nextItem();
    expect(secondItem).toBeFalsy();
  });
})
