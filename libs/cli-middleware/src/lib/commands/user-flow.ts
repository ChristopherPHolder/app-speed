import { AuditExecutor, AuditQueue, AuditStore } from '@ufo/cli-interfaces';
import { UserFlowAudit } from '@ufo/user-flow-replay';
import { AuditRunParams } from 'shared';
import { sendAuditResults } from '../dialog';

export class UserFlowExecutor implements AuditExecutor {
  constructor(private queue: AuditQueue, private store: AuditStore) {}

  public async exec(): Promise<void> {
    console.log('Running UserFlowExecutor');
    let queueItem: AuditRunParams | void = await this.queue.nextItem();
    while (queueItem) {
      console.log('Executing Runner on', queueItem);
      const { requesterId, endpoint, targetUrl } = queueItem;
      const userFlowAudit = new UserFlowAudit(JSON.parse(targetUrl));
      const results = await userFlowAudit.results();
      console.log('Audit Results', results);
      const destination = await this.store.store(results);
      console.log('Audit results stored at', destination);
      await sendAuditResults(requesterId, endpoint, destination);
      queueItem = await this.queue.nextItem();
    }
  }
}

export default UserFlowExecutor;
