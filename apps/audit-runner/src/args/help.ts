import { Options } from 'yargs';

export const help: Options = {
  alias: 'h',
  default: false,
  type: 'boolean'
}

export interface HelpOption {
  help: boolean;
  h: boolean;
}
