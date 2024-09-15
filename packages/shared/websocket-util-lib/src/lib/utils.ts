import { CONDUCTOR_STAGE } from './constants';
import { StageChangeMessage, ConductorStages } from './types';

function isStageChangeMessage(message: unknown): message is StageChangeMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    'stage' in message &&
    message.type === 'stage-change'
  );
}

function isDoneStageChangeMessage(message: unknown): message is StageChangeMessage<ConductorStages['DONE']> {
  return isStageChangeMessage(message) && message.stage === CONDUCTOR_STAGE.DONE;
}

export { isStageChangeMessage, isDoneStageChangeMessage };
