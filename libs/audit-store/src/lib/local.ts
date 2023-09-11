import { AuditStore } from '@ufo/cli-interfaces';
import { ResultReports } from 'shared';

export type LocalStoreConfig = {
  storePath: string
}

export class LocalStore implements AuditStore {
  private storePath = './audit-results';

  constructor(config?: LocalStoreConfig) {
    if (config && config.storePath) {
      this.storePath = config.storePath;
    }
  }

  // TODO implement local store logic
  public async store(auditResults: ResultReports): Promise<boolean> {
    return true;
  }
}

export default LocalStore;
