import { join } from 'path';
import { cwd } from 'process';
import { readdirSync, readFileSync } from 'fs'

import { AuditQueue } from '@ufo/cli-middleware';
import { AuditRunParams } from 'shared';

export type LocalQueueConfig = {
  path: string
}

export class LocalQueue implements AuditQueue {

  private readonly localPath: string;
  private readonly queuedRef: string[];

  constructor(config: LocalQueueConfig) {
    this.localPath = config.path;
    this.queuedRef = readdirSync(join(cwd(), this.localPath));
  }

  private readReadItem(item: string) {
    const file = readFileSync(join(this.localPath, item), { encoding: 'utf-8' });
    return JSON.parse(file);
  }

  // @TODO create proper audit guard;
  private isValidAuditParams(item: any): item is AuditRunParams {
    return !!item;
  }

  async nextItem(): Promise<AuditRunParams | void> {
    if (!this.queuedRef || !this.queuedRef.length) {
      return;
    }
    const item = this.readReadItem(this.queuedRef[0]);
    this.queuedRef.shift();
    if (!this.isValidAuditParams(item)) {
      return await this.nextItem();
    }
    return item;
  }
}

export default LocalQueue;
