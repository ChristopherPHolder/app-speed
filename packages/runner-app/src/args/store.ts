import { Options } from 'yargs';

export const store: Options = {
  describe: 'Queue path of config',
  alias: 's',
  default: 'local',
  type: 'string'
}

export interface StoreOption {
  store: string;
  s: string;
}
