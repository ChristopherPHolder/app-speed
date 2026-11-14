import type Details from 'lighthouse/types/lhr/audit-details';
import { buildTableBaseModel } from './table.adaptor';
import type { ViewerDiagnosticContext } from './viewer-diagnostic.models';

const scriptUrl = 'https://connect.facebook.net/en_US/fbevents.js';

const location = (url: string) => ({
  type: 'source-location' as const,
  url,
  urlProvider: 'network' as const,
  line: 23,
  column: 6382,
});

// The shape of Lighthouse 13's legacy-javascript table.
const legacyJavascript = (subItemUrl: string): Details.Table => ({
  type: 'table',
  headings: [
    { key: 'url', label: 'URL', valueType: 'url', subItemsHeading: { key: 'location', valueType: 'source-location' } },
    { key: null, label: '', valueType: 'code', subItemsHeading: { key: 'signal' } },
    { key: 'wastedBytes', label: 'Wasted bytes', valueType: 'bytes' },
  ],
  items: [
    {
      url: scriptUrl,
      wastedBytes: 12210,
      subItems: {
        type: 'subitems',
        items: [{ signal: '@babel/plugin-transform-classes', location: location(subItemUrl) }],
      },
    },
  ],
});

const rows = (details: Details.Table, context: ViewerDiagnosticContext | null = null) =>
  buildTableBaseModel({ details, auditId: 'legacy-javascript', context }).bundles.flatMap((bundle) => bundle.rows);

describe('buildTableBaseModel', () => {
  it('passes the parent URL to a sub-item source location in the same file', () => {
    const [parent, subItem] = rows(legacyJavascript(scriptUrl));

    expect(parent.cells[0].parentUrl).toBeUndefined();
    expect(subItem.isSubItem).toBe(true);
    expect(subItem.cells[0].parentUrl).toBe(scriptUrl);
    expect(subItem.cells[1].value).toBe('@babel/plugin-transform-classes');
  });

  it('keeps the full location when a sub-item points into another file', () => {
    const [, subItem] = rows(legacyJavascript('https://connect.facebook.net/signals/config.js'));

    expect(subItem.cells[0].parentUrl).toBeUndefined();
  });

  it('sums typed numeric values when grouping rows by entity', () => {
    const details: Details.Table = {
      type: 'table',
      headings: [
        { key: 'url', label: 'URL', valueType: 'url' },
        { key: 'score', label: 'Score', valueType: 'numeric' },
      ],
      items: [
        { url: 'https://deep-blue.io/a.js', score: { type: 'numeric', value: 0.25 } },
        { url: 'https://deep-blue.io/b.js', score: { type: 'numeric', value: 0.5 } },
      ],
    };
    const context: ViewerDiagnosticContext = {
      entities: [{ name: 'Deep Blue', isFirstParty: true, origins: ['https://deep-blue.io'] }],
    };

    const [group] = rows(details, context);

    expect(group.isGroup).toBe(true);
    expect(group.cells[1].value).toBe(0.75);
  });
});
