import { CONDUCTOR_STAGE } from './constants';

type ConductorStages = typeof CONDUCTOR_STAGE;
type ConductorStage = (typeof CONDUCTOR_STAGE)[keyof ConductorStages];

type StageChangeMessageBase<Stage extends ConductorStage = ConductorStage> = {
  type: 'stage-change';
  stage: Stage;
};

type DoneStageChangeMessage = StageChangeMessageBase<ConductorStages['DONE']> & {
  key: string;
};

type StageChangeMessage<Stage = ConductorStage> = Stage extends ConductorStages['DONE']
  ? DoneStageChangeMessage
  : Stage extends ConductorStage
    ? StageChangeMessageBase
    : never;

export type { StageChangeMessage, ConductorStages };

// Should error because it is missing stage property
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const invalidStageChangeMessage: StageChangeMessage = {
  type: 'stage-change',
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const stageChangeMessage: StageChangeMessage = {
  type: 'stage-change',
  stage: CONDUCTOR_STAGE.SCHEDULED,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const scheduledStageChangeMessage: StageChangeMessage<ConductorStages['SCHEDULED']> = {
  type: 'stage-change',
  stage: CONDUCTOR_STAGE.SCHEDULED,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const runningStageChangeMessage: StageChangeMessage<ConductorStages['RUNNING']> = {
  type: 'stage-change',
  stage: CONDUCTOR_STAGE.RUNNING,
};

// Should error because DoneStageChangeMessage requires a key property
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const invalidStageChangeMessage: StageChangeMessage = {
  type: 'stage-change',
  stage: CONDUCTOR_STAGE.DONE,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const doneStageChangeChangeMessage: StageChangeMessage<ConductorStages['DONE']> = {
  type: 'stage-change',
  stage: CONDUCTOR_STAGE.DONE,
  key: 'DUMMY_KEY',
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const failedStageChangeChangeMessage: StageChangeMessage<ConductorStages['FAILED']> = {
  type: 'stage-change',
  stage: CONDUCTOR_STAGE.FAILED,
};
