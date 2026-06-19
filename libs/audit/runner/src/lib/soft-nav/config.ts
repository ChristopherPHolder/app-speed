import type Config from 'lighthouse/types/config.js';
import SoftNavFcp from './audits/soft-nav-fcp.js';
import SoftNavLcp from './audits/soft-nav-lcp.js';

export const softNavigationConfig = {
  audits: [{ implementation: SoftNavFcp }, { implementation: SoftNavLcp }],
} satisfies Config;

export const softNavigationPerformanceAuditRefs = [
  { id: 'soft-nav-fcp', weight: 10, group: 'metrics', acronym: 'FCP' },
  { id: 'soft-nav-lcp', weight: 25, group: 'metrics', acronym: 'LCP' },
] satisfies Config.AuditRefJson[];
