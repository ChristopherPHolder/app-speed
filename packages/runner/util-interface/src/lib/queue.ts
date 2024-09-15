import { AuditRunParams } from '@app-speed/shared';

export type AuditQueue = Queue<AuditRunParams>;

interface Queue <T>{
  nextItem(): Promise<T | void>;
}
