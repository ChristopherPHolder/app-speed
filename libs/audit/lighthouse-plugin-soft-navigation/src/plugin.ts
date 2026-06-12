import type { Config } from 'lighthouse';

const plugin: Config.Plugin = {
  audits: [
    { path: '@app-speed/lighthouse-plugin-soft-navigation/audits/soft-nav-fcp' },
    { path: '@app-speed/lighthouse-plugin-soft-navigation/audits/soft-nav-lcp' },
  ],
  groups: {
    metrics: {
      title: 'Metrics associated with a soft navigation',
    },
  },
  category: {
    title: 'Soft Navigation',
    supportedModes: ['timespan'],
    auditRefs: [
      { id: 'soft-nav-fcp', weight: 1, group: 'metrics' },
      { id: 'soft-nav-lcp', weight: 1, group: 'metrics' },
    ],
  },
};

export default plugin;
