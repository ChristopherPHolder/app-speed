import { Options } from 'yargs';

export const queue: Options = {
  describe: 'Queue path of config',
  alias: 'q',
  default: 'local',
  type: 'string',
};

export interface QueueOption {
  queue: string;
  q: string;
}
