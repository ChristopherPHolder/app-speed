import { Options } from 'yargs';

export const shutdown: Options = {
  type: 'boolean',
  default: false
};

export interface ShutdownOption {
  shutdown: boolean;
}
