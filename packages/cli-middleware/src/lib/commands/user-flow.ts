import { AuditExecutor, AuditQueue, AuditStore } from '@app-speed/cli-interfaces';
import { UserFlowAudit } from '@app-speed/user-flow-replay';
import { AuditRunParams } from '@app-speed/shared';
import { sendAuditResults } from '../dialog';

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

      // @TODO We need to inform the requester that it audit is now running
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
      }

      queueItem = await this.queue.nextItem();
    }
  }
}

export default UserFlowExecutor;
