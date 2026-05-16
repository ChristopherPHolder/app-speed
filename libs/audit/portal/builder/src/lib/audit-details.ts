import { AuditAuthoring } from '@app-speed/audit/domain';

export type AuditDetails = AuditAuthoring;

export const DEFAULT_AUDIT_DETAILS = {
  title: '',
  device: 'mobile',
  timeout: 30000,
  steps: [
    { type: 'customStep', step: 'startNavigation', name: 'Initial Navigation' },
    { type: 'navigate', url: '' },
    { type: 'customStep', step: 'endNavigation' },
  ],
} as const satisfies AuditDetails;
