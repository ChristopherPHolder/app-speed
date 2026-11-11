import { describe, expect, it } from 'vitest';
import { defaultConfig } from 'lighthouse';
import { initializeConfig } from 'lighthouse/core/config/config.js';
import { filterAuditsByAvailableArtifacts } from 'lighthouse/core/config/filters.js';
import { experimentalNavigationConfig } from './audits';
import { softNavigationConfig } from './config';

type SoftNavigationConfig = Awaited<ReturnType<typeof softNavigationConfig>>;

const preset = () => experimentalNavigationConfig(defaultConfig);
const auditIds = ({ audits }: SoftNavigationConfig) =>
  (audits ?? []).map(({ implementation }) => implementation.meta.id);
const refIds = ({ categories }: SoftNavigationConfig, category: string) =>
  categories?.[category]?.auditRefs.map((ref) => ref.id) ?? [];

describe('soft navigation collection configuration', () => {
  it('reports every category a navigation reports', async () => {
    const { resolvedConfig: navigation } = await initializeConfig('navigation', preset());
    const config = await softNavigationConfig(preset(), {});
    expect(Object.keys(config.categories ?? {})).toEqual(Object.keys(navigation.categories ?? {}));
    expect(Object.keys(config.categories ?? {})).toEqual(
      expect.arrayContaining(['performance', 'accessibility', 'best-practices', 'seo']),
    );
  });

  it('reports a configured audit under every category a navigation reports it under', async () => {
    const { resolvedConfig: navigation } = await initializeConfig('navigation', preset());
    const config = await softNavigationConfig(preset(), {});
    const configured = new Set(auditIds(config));
    const missing = Object.entries(navigation.categories ?? {}).flatMap(([id, category]) =>
      category.auditRefs
        .filter((ref) => configured.has(ref.id) && !refIds(config, id).includes(ref.id))
        .map((ref) => `${id}/${ref.id}`),
    );
    expect(missing).toEqual([]);
  });

  it('reports each audit once per category', async () => {
    const config = await softNavigationConfig(preset(), {});
    const duplicated = Object.keys(config.categories ?? {}).flatMap((id) =>
      refIds(config, id)
        .filter((ref, index, refs) => refs.indexOf(ref) !== index)
        .map((ref) => `${id}/${ref}`),
    );
    // A repeated reference weighs its audit twice in the category score.
    expect(duplicated).toEqual([]);
  });

  it('reports audits in the order a navigation reports them', async () => {
    const { resolvedConfig: navigation } = await initializeConfig('navigation', preset());
    const config = await softNavigationConfig(preset(), {});
    for (const [id, category] of Object.entries(navigation.categories ?? {})) {
      const reported = refIds(config, id);
      const stock = category.auditRefs.map((ref) => ref.id);
      expect(reported.filter((ref) => stock.includes(ref))).toEqual(stock.filter((ref) => reported.includes(ref)));
    }
  });

  it('collects the artifacts both the transition and the resulting view need', async () => {
    const ids = ((await softNavigationConfig(preset(), {})).artifacts ?? []).map((artifact) => artifact.id);
    expect(ids).toEqual(expect.arrayContaining(['Trace', 'DevtoolsLog', 'Accessibility', 'MetaElements']));
    // A document that is never requested has no main document response to read.
    expect(ids).not.toContain('MainDocumentContent');
  });

  it('keeps the interval metrics alongside the audits of the resulting view', async () => {
    const config = await softNavigationConfig(preset(), {});
    expect(auditIds(config)).toEqual(
      expect.arrayContaining([
        'first-contentful-paint',
        'largest-contentful-paint',
        'interaction-to-next-paint',
        'color-contrast',
        'meta-description',
      ]),
    );
    expect(refIds(config, 'performance')).toEqual(
      expect.arrayContaining(['first-contentful-paint', 'interaction-to-next-paint']),
    );
    expect(refIds(config, 'accessibility')).toContain('color-contrast');
    expect(refIds(config, 'seo')).toContain('meta-description');
  });

  it('drops the audits that require a document load', async () => {
    const ids = auditIds(await softNavigationConfig(preset(), {}));
    expect(ids).not.toContain('server-response-time');
    expect(ids).not.toContain('redirects');
    expect(ids).not.toContain('canonical');
  });

  it('configures only audits whose artifacts it collects', async () => {
    const config = await softNavigationConfig(preset(), {});
    const runnable = filterAuditsByAvailableArtifacts(config.audits, config.artifacts ?? []);
    expect((runnable ?? []).map(({ implementation }) => implementation.meta.id)).toEqual(auditIds(config));
  });

  it('measures the interval with observed throttling', async () => {
    expect(defaultConfig.settings?.throttlingMethod).toBe('simulate');
    expect((await softNavigationConfig(preset(), {})).settings.throttlingMethod).toBe('devtools');
  });

  it('selects categories it reports but an interval does not', async () => {
    const config = await softNavigationConfig(preset(), { onlyCategories: ['seo'] });
    expect(Object.keys(config.categories ?? {})).toEqual(['seo']);
    expect(auditIds(config)).toContain('meta-description');
    expect(auditIds(config)).not.toContain('color-contrast');
  });

  it('rejects a category no flow reports', async () => {
    await expect(softNavigationConfig(preset(), { onlyCategories: ['not-a-category'] })).rejects.toThrow(
      'unrecognized category',
    );
  });

  it('respects explicit audit exclusions', async () => {
    const ids = auditIds(
      await softNavigationConfig(preset(), { skipAudits: ['color-contrast', 'first-contentful-paint'] }),
    );
    expect(ids).not.toContain('color-contrast');
    expect(ids).not.toContain('first-contentful-paint');
    expect(ids).toContain('largest-contentful-paint');
  });
});
