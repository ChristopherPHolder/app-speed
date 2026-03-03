import { AppSpeedUserFlow, AppSpeedUserFlowStep } from '@app-speed/shared-utils';
import { parse as puppeteerReplayParse, StepType } from '@puppeteer/replay';
import { isMeasureType } from './utils';

export function parse(recordingJson: unknown): AppSpeedUserFlow {
  // custom events to exclude from the default parser
  const ufArr: AppSpeedUserFlowStep[] = [];
  if (typeof recordingJson !== 'object' || recordingJson === null) {
    throw new Error('Recording must be an object');
  }
  const recording = recordingJson as Record<string, unknown>;

  if (typeof recording['title'] !== 'string') {
    throw new Error('Recording is missing `title`');
  }
  if (!Array.isArray(recording['steps'])) {
    throw new Error('Recording is missing `steps`');
  }

  const recordingSteps = recording['steps'] as AppSpeedUserFlowStep[];
  const steps = recordingSteps.filter((value: AppSpeedUserFlowStep, index: number) => {
    const isNotMeasureType = !isMeasureType(value.type);
    if (!isNotMeasureType) ufArr[index] = value;
    return isNotMeasureType;
  });

  if (ufArr.length === 0) {
    throw new Error('Recording is missing a lighthouse measurement step');
  }

  const parsed: AppSpeedUserFlow = puppeteerReplayParse({ ...recording, steps });

  ufArr.forEach((value, index) => {
    if (value) {
      parsed.steps.splice(index, 0, value);
    }
  });

  // parse customEvents from our stringify function
  parsed.steps = parsed.steps.map((step) => {
    if (step.type === StepType.CustomStep) {
      const customStep = step as { name?: unknown; parameters?: unknown };
      if (typeof customStep.name === 'string' && isMeasureType(customStep.name)) {
        return { type: customStep.name, parameters: customStep.parameters } as AppSpeedUserFlowStep;
      }
    }
    return step;
  });

  return parsed;
}
