import { AuditRunParams } from '@app-speed/shared';

export abstract class AuditQueue {
  abstract nextItem(): Promise<AuditRunParams | void>;
}
