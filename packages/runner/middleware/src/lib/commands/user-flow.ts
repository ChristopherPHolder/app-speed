import { AuditExecutor, AuditQueue, AuditStore } from '@app-speed/runner-interfaces';
import { UserFlowAudit } from '@app-speed/user-flow-replay';
import { AuditRunParams } from '@app-speed/shared';
import { informAuditError, informAuditItRunning, sendAuditResults } from '../dialog';

export class UserFlowExecutor implements AuditExecutor {
  constructor(
    private queue: AuditQueue,
    private store: AuditStore,
  ) {}

  public async exec(): Promise<void> {
    console.log('Running UserFlowExecutor');
    let queueItem: AuditRunParams | void = await this.queue.nextItem();
    while (queueItem) {
      console.log('Executing Runner on', queueItem);
      const { requesterId, endpoint, targetUrl } = queueItem;

      await informAuditItRunning(requesterId, endpoint);

      try {
        const userFlowAudit = new UserFlowAudit(JSON.parse(targetUrl));
        const results = await userFlowAudit.results();
        console.log('Audit Results', results);
        const destination = await this.store.store(results);
        console.log('Audit results stored at', destination);
        await sendAuditResults(requesterId, endpoint, destination);
      } catch (error) {
        console.error(error);
        // @TODO we need to inform the requester the audit failed and why!
        await informAuditError(requesterId, endpoint);
      }

      queueItem = await this.queue.nextItem();
    }
  }
}

export default UserFlowExecutor;
