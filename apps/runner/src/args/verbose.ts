import { Options } from 'yargs';

export const verbose: Options = {
  alias: 'v',
  default: false,
  type: 'boolean',
};

export interface VerboseOption {
  verbose: boolean;
  v: boolean;
}
