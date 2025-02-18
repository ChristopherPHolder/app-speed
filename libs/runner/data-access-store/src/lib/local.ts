import { AuditStore } from '@app-speed/runner-interfaces';
import { ResultReports } from '@app-speed/shared-utils';

export type LocalStoreConfig = {
  storePath: string;
};

export class LocalStore implements AuditStore {
  private storePath = './audit-results';

  constructor(config?: LocalStoreConfig) {
    if (config && config.storePath) {
      this.storePath = config.storePath;
    }
  }

  // TODO implement local store logic
  public async store(auditResults: ResultReports): Promise<string> {
    return 'destination';
  }
}
