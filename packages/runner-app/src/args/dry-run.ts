import { Options } from 'yargs';

export const dryRun: Options = {
  default: false,
  type: 'boolean'
}

export interface DryRunOption {
  dryRun?: boolean;
}
