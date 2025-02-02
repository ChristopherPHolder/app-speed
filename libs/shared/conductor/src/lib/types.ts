import { AUDIT_STAGE, AUDIT_STAGE_CHANGE_EVENT, EVENT_MESSAGE } from './constants';

export type AuditStages = typeof AUDIT_STAGE;
export type AuditStageKey = keyof AuditStages;
export type AuditStage = AuditStages[AuditStageKey];

export type AuditStageChangeEvents = (typeof AUDIT_STAGE_CHANGE_EVENT)[number];

export type ConductorEventMessageTypes = typeof EVENT_MESSAGE;
export type ConductorEventMessageTypeKey = keyof ConductorEventMessageTypes;
export type ConductorEventMessageType = ConductorEventMessageTypes[ConductorEventMessageTypeKey];

type StageChangeMessageDataMap = {
  [AUDIT_STAGE.DONE]: { key: string };
};

type StageChangeEventsWithData = keyof StageChangeMessageDataMap;

type StageChangeMessageData<AuditStageType extends AuditStageChangeEvents> =
  AuditStageType extends keyof StageChangeMessageDataMap ? StageChangeMessageDataMap[AuditStageType] : never;

export interface ConductorEventMessageBase<EventType extends ConductorEventMessageType = ConductorEventMessageType> {
  event: EventType;
}

export interface ConductorStageChangeMessageBase<AuditStageType extends AuditStageChangeEvents>
  extends ConductorEventMessageBase<ConductorEventMessageTypes['STAGE_CHANGE']> {
  stage: AuditStageType;
}

export interface ConductorStageChangeMessageWithData<AuditStageType extends StageChangeEventsWithData>
  extends ConductorStageChangeMessageBase<AuditStageType> {
  data: StageChangeMessageData<AuditStageType>;
}

export type ConductorStageChangeMessage<AuditStageType extends AuditStageChangeEvents> =
  AuditStageType extends StageChangeEventsWithData
    ? ConductorStageChangeMessageWithData<AuditStageType>
    : ConductorStageChangeMessageBase<AuditStageType>;

export type ConductorStageChangeUnknownMessage = ConductorStageChangeMessage<AuditStageChangeEvents>;
