import { AuditQueue } from 'shared';

export class LocalQueue implements AuditQueue {

  constructor(config: any) {
    console.info('Config', config)


  }

  async nextItem(): Promise<any> {
    return console.info('Next item Void');
  }
}
