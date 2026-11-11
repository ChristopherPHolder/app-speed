import { initializeConfig } from 'lighthouse/core/config/config.js';
import { filterCategoriesByAvailableAudits, filterConfigByExplicitFilters } from 'lighthouse/core/config/filters.js';

type ResolvedConfig = Awaited<ReturnType<typeof initializeConfig>>['resolvedConfig'];
type Config = Parameters<typeof initializeConfig>[1];
type Flags = Parameters<typeof initializeConfig>[2];
type Categories = NonNullable<ResolvedConfig['categories']>;
type Audits = NonNullable<ResolvedConfig['audits']>;

/**
 * Merge a list into the ordering `primary` states, placing an entry `primary` does not hold between
 * the entries that surround it in `secondary`. Each identity is emitted once, so a `secondary` whose
 * order contradicts `primary` costs placement rather than a duplicate: a duplicated audit reference
 * would weigh its audit twice in the category score.
 */
function mergeOrdered<Entry>(
  primary: readonly Entry[],
  secondary: readonly Entry[],
  identify: (entry: Entry) => string,
): Entry[] {
  const merged: Entry[] = [];
  const emitted = new Set<string>();
  const take = (entry: Entry) => {
    const id = identify(entry);
    if (emitted.has(id)) return;
    emitted.add(id);
    merged.push(entry);
  };
  let next = 0;
  for (const entry of secondary) {
    const id = identify(entry);
    const shared = primary.findIndex((candidate, index) => index >= next && identify(candidate) === id);
    if (shared < 0) {
      take(entry);
      continue;
    }
    primary.slice(next, shared + 1).forEach(take);
    next = shared + 1;
  }
  primary.slice(next).forEach(take);
  return merged;
}

function mergeCategories(primary: Categories | null, secondary: Categories | null): Categories | null {
  if (!primary || !secondary) return primary ?? secondary ?? null;
  return Object.fromEntries(
    mergeOrdered(Object.keys(primary), Object.keys(secondary), (id) => id).map((id) => {
      const category = primary[id] ?? secondary[id];
      return [
        id,
        {
          ...category,
          auditRefs: mergeOrdered(primary[id]?.auditRefs ?? [], secondary[id]?.auditRefs ?? [], (ref) => ref.id),
        },
      ];
    }),
  );
}

function adaptAudits(audits: Audits): Audits {
  return audits.map((definition) => {
    const Original = definition.implementation;
    return {
      ...definition,
      implementation: class extends Original {
        static override get meta() {
          return { ...Original.meta, supportedModes: ['navigation' as const] };
        }
        static override audit(
          artifacts: Parameters<typeof Original.audit>[0],
          context: Parameters<typeof Original.audit>[1],
        ) {
          // Stock interval audits must not look for a document navigationStart or simulate a page load.
          return Original.audit({ ...artifacts, GatherContext: { gatherMode: 'timespan' } }, context);
        }
      },
    };
  });
}

/**
 * The configuration for collecting an existing document's transition.
 *
 * A soft navigation is an interval that ends in a new view, so it collects what interval collection
 * and view collection can each measure without a document load: the timespan artifacts record the
 * transition, the snapshot artifacts read the document it produced.
 *
 * The categories of a page load state which audits a category reports and in which order, because a
 * category may declare the modes it supports and so lose its references in a resolution we collect
 * from: accessibility, SEO and agentic browsing are not resolved for an interval at all. The
 * collection resolutions then contribute the references a page load cannot hold, such as INP, and
 * stock filtering trims the result to the audits this collection configures. Settings come from
 * interval collection, which rules out simulated throttling for a page load that never happens.
 *
 * A caller selects categories and audits against what this collection reports, so the selection is
 * applied to the merged configuration. Applying it to a collection resolution instead rejects a
 * category that resolution does not hold, such as SEO for an interval.
 */
export async function softNavigationConfig(config: Config, flags: Flags): Promise<ResolvedConfig> {
  const collected = { ...flags, onlyCategories: undefined, onlyAudits: undefined };
  const [{ resolvedConfig: interval }, { resolvedConfig: view }, { resolvedConfig: pageLoad }] = await Promise.all([
    initializeConfig('timespan', config, collected),
    initializeConfig('snapshot', config, collected),
    // Resolved with the caller's selection, which it validates against every category a flow reports.
    initializeConfig('navigation', config, flags),
  ]);
  const audits = mergeOrdered(interval.audits ?? [], view.audits ?? [], (audit) => audit.implementation.meta.id);
  const reported = mergeCategories(mergeCategories(pageLoad.categories, interval.categories), view.categories);
  const settings = {
    ...interval.settings,
    onlyAudits: pageLoad.settings.onlyAudits,
    onlyCategories: pageLoad.settings.onlyCategories,
  };
  const selected = filterConfigByExplicitFilters(
    {
      ...interval,
      settings,
      artifacts: mergeOrdered(interval.artifacts ?? [], view.artifacts ?? [], (artifact) => artifact.id),
      audits,
      categories: filterCategoriesByAvailableAudits(reported, audits),
    },
    settings,
  );
  return { ...selected, audits: adaptAudits(selected.audits ?? []) };
}
