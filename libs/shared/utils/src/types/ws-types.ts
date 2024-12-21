import { AuditRunParams, Reports } from './types';
import { AUDIT_REQUEST, AUDIT_STATUS } from '../constants/constants';

type _ = keyof typeof AUDIT_STATUS;
export type AuditStatusType = (typeof AUDIT_STATUS)[_];
type __ = keyof typeof AUDIT_REQUEST;
export type AuditRequestType = (typeof AUDIT_REQUEST)[__];
type AuditStatus = AuditStatusType | AuditRequestType;

type WsAction<A extends AuditStatus, T> = {
  type: A;
  payload: T;
};

export type UfWsSendActions = WsAction<'scheduleAudits', AuditRunParams>;
export type UfWsRecieveActions =
  | WsAction<'done', Reports>
  | WsAction<'idle', string>
  | WsAction<'scheduling', string>
  | WsAction<'queued', string>
  | WsAction<'loading', string>
  | WsAction<'failed', string>;
export type UfWsActions = UfWsSendActions | UfWsRecieveActions;
