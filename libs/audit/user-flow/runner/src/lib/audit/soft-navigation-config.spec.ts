import { describe, expect, it } from 'vitest';
import { initializeConfig } from 'lighthouse/core/config/config.js';

describe('soft navigation audit configuration', () => {
  const cases: { mode: 'navigation' | 'timespan'; softNavigation: boolean; includesInp: boolean }[] = [
    { mode: 'navigation', softNavigation: true, includesInp: true },
    { mode: 'navigation', softNavigation: false, includesInp: false },
    { mode: 'timespan', softNavigation: false, includesInp: true },
  ];

  it.each(cases)(
    'includes INP=$includesInp for $mode with softNavigation=$softNavigation',
    async ({ mode, softNavigation, includesInp }) => {
      const { resolvedConfig } = await initializeConfig(mode, undefined, { softNavigation });
      expect(
        resolvedConfig.audits?.some(({ implementation }) => implementation.meta.id === 'interaction-to-next-paint'),
      ).toBe(includesInp);
      expect(
        resolvedConfig.categories?.['performance'].auditRefs.some(({ id }) => id === 'interaction-to-next-paint'),
      ).toBe(includesInp);
      if (softNavigation) expect(resolvedConfig.settings.throttlingMethod).toBe('devtools');
    },
  );

  it('respects an explicit request to skip INP', async () => {
    const { resolvedConfig } = await initializeConfig('navigation', undefined, {
      softNavigation: true,
      skipAudits: ['interaction-to-next-paint'],
    });
    expect(
      resolvedConfig.audits?.some(({ implementation }) => implementation.meta.id === 'interaction-to-next-paint'),
    ).toBe(false);
    expect(
      resolvedConfig.categories?.['performance'].auditRefs.some(({ id }) => id === 'interaction-to-next-paint'),
    ).toBe(false);
  });
});
