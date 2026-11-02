import type { FlowResult } from 'lighthouse';

export type UserFlowResult = Omit<FlowResult, 'steps'> & {
  steps: (FlowResult.Step & { softNavigation?: boolean })[];
};
