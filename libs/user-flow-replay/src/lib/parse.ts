import { UserFlowRecordingStep, UserFlowReportJson } from './types';
import { parse as puppeteerReplayParse, StepType } from '@puppeteer/replay';
import { isMeasureType } from './utils';

// @TODO parse() should have a more specific type
export function parse(recordingJson: any): UserFlowReportJson {
  // custom events to exclude from the default parser
  const ufArr: UserFlowRecordingStep[] = [];

  // @TODO fix error catching, should be able to handle incorrect input
  let steps;
  try {
    // filter out user-flow specific actions
    steps = recordingJson.steps.filter(
      (value: any, index: number) => {
        if (isMeasureType(value?.type)) {
          ufArr[index] = value;
          return false;
        }
        return true;
      }
    );
    // eslint-disable-next-line no-empty
  } catch {}


  // parse the clean steps
  const parsed: UserFlowReportJson = puppeteerReplayParse({ ...recordingJson, steps });
  // add in user-flow specific actions
  ufArr.forEach((value, index) => {
    value && (parsed.steps.splice(index, 0, value));
  });

  // parse customEvents from our stringify function
  parsed.steps = parsed.steps.map((step) => {
    if (step.type === StepType.CustomStep && isMeasureType(step.name)) {
      const { name: type, parameters } = step as any;
      return { type, parameters } as UserFlowRecordingStep;
    }
    return step;
  });

  return parsed;
}
