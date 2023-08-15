import { AuditExecutor, AuditQueue, AuditStore } from '@ufo/cli-interfaces';
import { UserFlowAudit } from '@ufo/user-flow-replay';
import { AuditRunParams } from 'shared';

export class UserFlowExecutor implements AuditExecutor {
  constructor(private queue: AuditQueue, private store: AuditStore) {}

  public async exec(): Promise<void> {
    let queueItem: AuditRunParams | void = await this.queue.nextItem();
    while (queueItem) {
      const userFlowAudit = new UserFlowAudit(queueItem as any);
      await this.store.store(await userFlowAudit.run());
      queueItem = await this.queue.nextItem();
    }
  }
}

export default UserFlowExecutor;
