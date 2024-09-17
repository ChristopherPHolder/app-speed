import { AppSpeedUserFlow, AppSpeedUserFlowStep } from '@app-speed/shared';
import { parse as puppeteerReplayParse, StepType } from '@puppeteer/replay';
import { isMeasureType } from './utils';

// @TODO parse() should have a more specific type
export function parse(recordingJson: any): AppSpeedUserFlow {
  // custom events to exclude from the default parser
  const ufArr: AppSpeedUserFlowStep[] = [];

  if (typeof recordingJson.title !== 'string') {
    throw new Error('Recording is missing `title`');
  }
  if (!Array.isArray(recordingJson.steps)) {
    throw new Error('Recording is missing `steps`');
  }

  const steps = recordingJson.steps.filter((value: AppSpeedUserFlowStep, index: number) => {
    const isNotMeasureType = !isMeasureType(value.type);
    if (!isNotMeasureType) ufArr[index] = value;
    return isNotMeasureType;
  });

  if (ufArr.length === 0) {
    throw new Error('Recording is missing a lighthouse measurement step');
  }

  const parsed: AppSpeedUserFlow = puppeteerReplayParse({ ...recordingJson, steps });

  ufArr.forEach((value, index) => {
    value && (parsed.steps.splice(index, 0, value));
  });

  // parse customEvents from our stringify function
  parsed.steps = parsed.steps.map((step) => {
    if (step.type === StepType.CustomStep && isMeasureType(step.name)) {
      const { name: type, parameters } = step as any;
      return { type, parameters } as AppSpeedUserFlowStep;
    }
    return step;
  });

  return parsed;
}
