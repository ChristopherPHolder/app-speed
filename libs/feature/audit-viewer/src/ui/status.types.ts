import { STATUS_OPTIONS } from './status.constants';

export type StatusOptions = typeof STATUS_OPTIONS[keyof typeof STATUS_OPTIONS];
