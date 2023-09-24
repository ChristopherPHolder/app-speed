import { AuditExecutor, AuditQueue, AuditStore } from '@ufo/cli-interfaces';
import { UserFlowAudit } from '@ufo/user-flow-replay';
import { AuditRunParams } from 'shared';
import { sendAuditResults } from '../dialog';

export class UserFlowExecutor implements AuditExecutor {
  constructor(private queue: AuditQueue, private store: AuditStore) {}

  public async exec(): Promise<void> {
    let queueItem: AuditRunParams | void = await this.queue.nextItem();
    while (queueItem) {
      const { requesterId, endpoint, audit } = queueItem;
      const userFlowAudit = new UserFlowAudit(audit);
      const results = await userFlowAudit.results();
      const destination = await this.store.store(results);
      await sendAuditResults(requesterId, endpoint, destination);
      queueItem = await this.queue.nextItem();
    }
  }
}

export default UserFlowExecutor;
