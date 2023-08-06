import { AuditRunParams } from '../types/types';

export type AuditQueue = Queue<AuditRunParams>;

interface Queue <T>{
  nextItem(): Promise<T | void>;
}
