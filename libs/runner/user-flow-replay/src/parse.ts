import { AppSpeedUserFlow } from '@app-speed/shared-user-flow-replay';
import { parse as puppeteerReplayParse } from '@puppeteer/replay';

// @TODO parse() should have a more specific type
export function parse(recordingJson: any): AppSpeedUserFlow {
  return puppeteerReplayParse({ ...recordingJson });
}
