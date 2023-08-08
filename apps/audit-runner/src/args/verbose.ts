import yargs from 'yargs';

export const verbose: yargs.Options = {
  alias: 'v',
  default: false,
  type: 'boolean'
}
