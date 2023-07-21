import { startFlow } from 'lighthouse';

export function userFlowReplay(): string {
  const t = startFlow()
  return 'user-flow-replay';
}
