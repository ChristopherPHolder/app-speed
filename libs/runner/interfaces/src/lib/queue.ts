import { AuditRunParams } from '@app-speed/shared-utils';

export abstract class AuditQueue {
  abstract nextItem(): Promise<AuditRunParams | void>;
}
