import { describe, expect, it } from 'vitest';
import { defaultConfig } from 'lighthouse';
import { initializeConfig } from 'lighthouse/core/config/config.js';
import { experimentalNavigationConfig } from '../soft-navigation/audits';

describe('local soft navigation audit configuration', () => {
  it('retains standard paint metrics and INP for interaction collection with stock Lighthouse', async () => {
    const { resolvedConfig } = await initializeConfig('timespan', experimentalNavigationConfig(defaultConfig));
    const ids = resolvedConfig.audits?.map(({ implementation }) => implementation.meta.id);
    expect(ids).toEqual(
      expect.arrayContaining(['first-contentful-paint', 'largest-contentful-paint', 'interaction-to-next-paint']),
    );
  });
  it('keeps native page-load audits available', async () => {
    const { resolvedConfig } = await initializeConfig('navigation', experimentalNavigationConfig(defaultConfig));
    const ids = resolvedConfig.audits?.map(({ implementation }) => implementation.meta.id);
    expect(ids).toContain('first-contentful-paint');
    expect(ids).not.toContain('interaction-to-next-paint');
  });
  it('respects explicit audit exclusions', async () => {
    const { resolvedConfig } = await initializeConfig('timespan', experimentalNavigationConfig(defaultConfig), {
      skipAudits: ['first-contentful-paint', 'largest-contentful-paint', 'interaction-to-next-paint'],
    });
    expect(
      resolvedConfig.audits?.some(({ implementation }) =>
        ['first-contentful-paint', 'largest-contentful-paint', 'interaction-to-next-paint'].includes(
          implementation.meta.id,
        ),
      ),
    ).toBe(false);
  });
});
