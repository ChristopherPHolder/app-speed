import { join } from 'path';
import { cwd } from 'process';
import { readdirSync, readFileSync } from 'fs';

import { AuditQueue, AuditRunParams } from '@app-speed/runner-interface';

export type LocalQueueConfig = {
  path: string;
};

export class LocalQueue implements AuditQueue {
  private readonly defaultConfig = { path: './user-flow' };
  private readonly localPath: string;
  private readonly queuedRef: string[];

  constructor(config: LocalQueueConfig) {
    this.localPath = config?.path || this.defaultConfig.path;
    try {
      this.queuedRef = readdirSync(join(cwd(), this.localPath));
    } catch {
      this.queuedRef = [];
    }
  }

  private readReadItem(item: string): object | void {
    if (!item.includes('json')) {
      return;
    }
    const file = readFileSync(join(this.localPath, item), { encoding: 'utf-8' });
    return JSON.parse(file);
  }

  // TODO implement validator
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
