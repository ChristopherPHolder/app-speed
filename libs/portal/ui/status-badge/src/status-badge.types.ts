import { STATUS } from './status-badge.constants';

export type StatusOptions = (typeof STATUS)[keyof typeof STATUS];
