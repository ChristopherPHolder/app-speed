import { AuditDetails } from './audit-builder.types';

export const DEFAULT_AUDIT_DETAILS: AuditDetails = {
  title: '',
  device: 'mobile',
  timeout: 30000,
  steps: [
    { type: 'startNavigation', stepOptions: { name: 'Initial Navigation' } },
    { type:  'navigate', url: 'https://google.com' },
    { type: 'endNavigation' },
  ]
};
