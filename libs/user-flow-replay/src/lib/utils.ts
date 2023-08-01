import { CustomStep, Step, StepType } from '@puppeteer/replay';
import { MeasureModes, AppSpeedUserFlowStep } from './types';

export function isMeasureType(str: string) {
    switch (str as MeasureModes) {
      case 'startNavigation':
      case 'endNavigation':
      case 'startTimespan':
      case 'endTimespan':
      case 'snapshot':
        return true;
      default:
        return false;
    }
}

export function stringify(enrichedRecordingJson: { title: string, steps: AppSpeedUserFlowStep[] }): string {
  const { title, steps } = enrichedRecordingJson;
  const standardizedJson = {
    title,
    steps: (steps).map(
      (step) => {
        if (isMeasureType(step.type)) {
          return userFlowStepToCustomStep(step as unknown as AppSpeedUserFlowStep);
        }
        return step;
      }
    )
  };
  return JSON.stringify(standardizedJson);
}

function userFlowStepToCustomStep(step: AppSpeedUserFlowStep): Step {
  const { type: name, parameters } = step as any;
  const stdStp: CustomStep = {
    type: StepType.CustomStep,
    name,
    parameters
  };
  return stdStp;
}
