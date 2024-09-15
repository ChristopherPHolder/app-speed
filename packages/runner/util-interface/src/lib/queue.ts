import { AuditRunParams } from './shared';

export type AuditQueue = Queue<AuditRunParams>;

interface Queue<T> {
  nextItem(): Promise<T | void>;
}
