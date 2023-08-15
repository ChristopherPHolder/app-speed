import yargs from 'yargs';

export const queue: yargs.Options = {
  describe: 'Queue path of config',
  alias: 'q',
  default: 'local',
  type: 'string'
}

