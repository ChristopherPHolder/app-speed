import plugin from './plugin.js';

describe('plugin', () => {
  it('registers the timespan category, group, and audits', () => {
    expect(plugin).toEqual({
      audits: [
        { path: '@app-speed/lighthouse-plugin-soft-navigation/audits/soft-nav-fcp' },
        { path: '@app-speed/lighthouse-plugin-soft-navigation/audits/soft-nav-lcp' },
      ],
      groups: {
        metrics: { title: 'Metrics associated with a soft navigation' },
      },
      category: {
        title: 'Soft Navigation',
        supportedModes: ['timespan'],
        auditRefs: [
          { id: 'soft-nav-fcp', weight: 1, group: 'metrics' },
          { id: 'soft-nav-lcp', weight: 1, group: 'metrics' },
        ],
      },
    });
  });
});
