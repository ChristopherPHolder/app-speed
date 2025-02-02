import {
  AuditStage,
  AuditStageChangeEvents,
  AuditStages,
  ConductorEventMessageBase,
  ConductorStageChangeMessage,
  ConductorStageChangeUnknownMessage,
} from './types';
import { AUDIT_STAGE, AUDIT_STAGE_CHANGE_EVENT, EVENT_MESSAGE } from './constants';

export function isConductorEventMessage(message: unknown): message is ConductorEventMessageBase {
  return typeof message === 'object' && message !== null && 'event' in message;
}

export function isConductorStageChangeEvent(
  message: ConductorEventMessageBase,
): message is ConductorStageChangeUnknownMessage {
  return message.event === EVENT_MESSAGE.STAGE_CHANGE;
}

export function isConductorStageChangeDoneEventMessage(
  message: ConductorStageChangeUnknownMessage,
): message is ConductorStageChangeMessage<AuditStages['DONE']> {
  return message.stage === AUDIT_STAGE.DONE;
}
// TODO why is this here?
export function isStageChangeEvent(stage: AuditStage): stage is AuditStageChangeEvents {
  return (AUDIT_STAGE_CHANGE_EVENT as unknown as string).includes(stage as unknown as string);
}
