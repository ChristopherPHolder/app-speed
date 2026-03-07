import type { Meta, StoryObj } from '@storybook/angular';
import { STATUS } from '@app-speed/portal-ui/status-badge';
import type Details from 'lighthouse/types/lhr/audit-details';
import { ViewerDiagnosticComponent } from './viewer-diagnostic.component';
import { DiagnosticItem, ViewerDiagnosticContext } from './viewer-diagnostic.models';

const svgDataUri = (label: string, background: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="220" viewBox="0 0 320 220">
      <rect width="320" height="220" rx="18" fill="${background}" />
      <rect x="20" y="20" width="280" height="32" rx="8" fill="rgba(255,255,255,0.55)" />
      <rect x="20" y="72" width="180" height="18" rx="9" fill="rgba(255,255,255,0.72)" />
      <rect x="20" y="102" width="240" height="14" rx="7" fill="rgba(255,255,255,0.45)" />
      <rect x="20" y="124" width="224" height="14" rx="7" fill="rgba(255,255,255,0.35)" />
      <rect x="20" y="162" width="112" height="28" rx="14" fill="rgba(255,255,255,0.88)" />
      <text x="20" y="208" fill="white" font-family="Arial, sans-serif" font-size="18" font-weight="700">${label}</text>
    </svg>`,
  )}`;

const fullPageSvgDataUri = (label: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1800" viewBox="0 0 1200 1800">
      <rect width="1200" height="1800" fill="#f5f8fb" />
      <rect x="0" y="0" width="1200" height="84" fill="#0f2f49" />
      <rect x="80" y="150" width="1040" height="520" rx="40" fill="#1b5a73" />
      <rect x="120" y="210" width="420" height="40" rx="20" fill="rgba(255,255,255,0.88)" />
      <rect x="120" y="280" width="640" height="28" rx="14" fill="rgba(255,255,255,0.58)" />
      <rect x="120" y="324" width="520" height="28" rx="14" fill="rgba(255,255,255,0.42)" />
      <rect x="120" y="410" width="220" height="64" rx="32" fill="#ffffff" />
      <rect x="700" y="220" width="320" height="320" rx="28" fill="rgba(255,255,255,0.72)" />
      <rect x="80" y="760" width="1040" height="220" rx="28" fill="#ffffff" />
      <rect x="80" y="1020" width="1040" height="220" rx="28" fill="#ffffff" />
      <rect x="80" y="1280" width="1040" height="220" rx="28" fill="#ffffff" />
      <text x="80" y="1720" fill="#0f2f49" font-family="Arial, sans-serif" font-size="42" font-weight="700">${label}</text>
    </svg>`,
  )}`;

const deepBlueContext: ViewerDiagnosticContext = {
  finalDisplayedUrl: 'https://deep-blue.io/',
  entities: [
    {
      name: 'Deep Blue',
      homepage: 'https://deep-blue.io/',
      category: 'hosting',
      isFirstParty: true,
      origins: ['https://deep-blue.io'],
    },
    {
      name: 'Google Tag Manager',
      homepage: 'https://marketingplatform.google.com/about/tag-manager/',
      category: 'tag manager',
      origins: ['https://www.googletagmanager.com'],
    },
    {
      name: 'Cloudflare CDN',
      homepage: 'https://www.cloudflare.com/',
      category: 'cdn',
      origins: ['https://cdnjs.cloudflare.com'],
    },
  ],
  fullPageScreenshot: {
    screenshot: {
      data: fullPageSvgDataUri('Deep Blue full page'),
      width: 1200,
      height: 1800,
    },
    nodes: {
      'hero-image': {
        left: 700,
        top: 220,
        width: 320,
        height: 320,
        right: 1020,
        bottom: 540,
      },
      'cta-button': {
        left: 120,
        top: 410,
        width: 220,
        height: 64,
        right: 340,
        bottom: 474,
      },
    },
  },
};

const unusedCssDetails: Details.Opportunity = {
  type: 'opportunity',
  headings: [
    { key: 'url', label: 'URL', valueType: 'url' },
    { key: 'wastedBytes', label: 'Transfer Size', valueType: 'bytes' },
  ],
  items: [
    {
      url: 'https://deep-blue.io/styles.a61f4c.css',
      wastedBytes: 66957,
      totalBytes: 104911,
    },
  ],
  overallSavingsBytes: 66957,
};

const unusedJavascriptDetails: Details.Opportunity = {
  type: 'opportunity',
  headings: [
    { key: 'url', label: 'URL', valueType: 'url' },
    { key: 'wastedBytes', label: 'Transfer Size', valueType: 'bytes' },
  ],
  items: [
    {
      url: 'https://deep-blue.io/app.f9df6e.js',
      wastedBytes: 61604,
      totalBytes: 166921,
    },
  ],
  overallSavingsBytes: 61604,
};

const legacyJavascriptDetails: Details.Table = {
  type: 'table',
  headings: [
    { key: 'url', label: 'URL', valueType: 'url' },
    { key: 'wastedBytes', label: 'Wasted Bytes', valueType: 'bytes' },
  ],
  items: [
    {
      url: 'https://deep-blue.io/app.f9df6e.js',
      wastedBytes: 2312,
    },
    {
      url: 'https://www.googletagmanager.com/gtm.js?id=GTM-XXXX',
      wastedBytes: 9411,
    },
    {
      url: 'https://cdnjs.cloudflare.com/ajax/libs/some-polyfill/4.0.0/polyfill.min.js',
      wastedBytes: 4744,
    },
  ],
};

const totalByteWeightDetails: Details.Table = {
  type: 'table',
  headings: [
    { key: 'url', label: 'URL', valueType: 'url' },
    { key: 'resourceType', label: 'Resource Type', valueType: 'text' },
    { key: 'transferSize', label: 'Transfer Size', valueType: 'bytes' },
  ],
  items: [
    {
      url: 'https://deep-blue.io/',
      resourceType: { type: 'text', value: 'Document' },
      transferSize: 37265,
    },
    {
      url: 'https://deep-blue.io/app.f9df6e.js',
      resourceType: { type: 'text', value: 'Script' },
      transferSize: 166921,
    },
    {
      url: 'https://deep-blue.io/styles.a61f4c.css',
      resourceType: { type: 'text', value: 'Stylesheet' },
      transferSize: 104911,
    },
    {
      url: 'https://deep-blue.io/hero.webp',
      resourceType: { type: 'text', value: 'Image' },
      transferSize: 99526,
    },
  ],
};

const networkRttDetails: Details.Table = {
  type: 'table',
  headings: [
    { key: 'url', label: 'Origin', valueType: 'url' },
    { key: 'time', label: 'Avg RTT', valueType: 'ms' },
  ],
  items: [
    {
      url: 'https://deep-blue.io',
      time: 39.893,
    },
  ],
};

const networkServerLatencyDetails: Details.Table = {
  type: 'table',
  headings: [
    { key: 'url', label: 'Origin', valueType: 'url' },
    { key: 'time', label: 'Avg Server Latency', valueType: 'ms' },
  ],
  items: [
    {
      url: 'https://deep-blue.io',
      time: 20.569,
    },
  ],
};

const richTableDetails: Details.Table = {
  type: 'table',
  headings: [
    { key: 'source', label: 'Source', valueType: 'source-location' },
    { key: 'message', label: 'Message', valueType: 'text' },
    { key: 'node', label: 'Element', valueType: 'node' },
    { key: 'snippet', label: 'Snippet', valueType: 'code' },
    { key: 'docs', label: 'Docs', valueType: 'link' },
    { key: 'score', label: 'Score', valueType: 'numeric', granularity: 0.01 },
    { key: null, label: 'Related Requests', valueType: 'url', subItemsHeading: { key: 'url', valueType: 'url' } },
  ],
  items: [
    {
      source: {
        type: 'source-location',
        url: 'https://deep-blue.io/app.f9df6e.js',
        urlProvider: 'network',
        line: 213,
        column: 17,
        original: {
          file: 'src/app/home/home.component.ts',
          line: 42,
          column: 8,
        },
      },
      message: { type: 'text', value: 'Layout shift observed during hero render.' },
      node: {
        type: 'node',
        lhId: 'hero-image',
        selector: 'section.hero img',
        nodeLabel: 'Hero image',
        snippet: '<img alt="Deep Blue hero" src="/hero.webp">',
        explanation: 'Preload the image and define intrinsic dimensions.',
      },
      snippet: {
        type: 'code',
        value: 'requestAnimationFrame(() => hero.classList.add("ready"));',
      },
      docs: {
        type: 'link',
        text: 'Optimization guide',
        url: 'https://developer.chrome.com/docs/lighthouse/performance/',
      },
      score: {
        type: 'numeric',
        value: 0.42,
        granularity: 0.01,
      },
      subItems: {
        type: 'subitems',
        items: [
          {
            url: {
              type: 'url',
              value: 'https://deep-blue.io/hero.webp',
            },
          },
          {
            url: {
              type: 'url',
              value: 'https://deep-blue.io/fonts/inter-var.woff2',
            },
          },
        ],
      },
    },
    {
      source: {
        type: 'source-location',
        url: 'webpack://hero-lcp.js',
        urlProvider: 'comment',
        line: 88,
        column: 3,
        original: {
          file: 'src/app/hero/lcp-observer.ts',
          line: 12,
          column: 2,
        },
      },
      message: {
        type: 'text',
        value: 'SourceURL-backed stack traces should still show a readable fallback.',
      },
      node: {
        type: 'node',
        lhId: 'cta-button',
        selector: 'section.hero .cta-button',
        nodeLabel: 'Primary CTA',
        snippet: '<button class="cta-button">Start the audit</button>',
        explanation: 'This node uses the same screenshot overlay path as node values in Lighthouse tables.',
      },
      snippet: {
        type: 'code',
        value: 'console.log("hydration started");',
      },
      docs: {
        type: 'link',
        text: 'Source map guidance',
        url: 'https://developer.chrome.com/docs/devtools/javascript/source-maps/',
      },
      score: {
        type: 'numeric',
        value: 0.84,
        granularity: 0.01,
      },
    },
  ],
};

const durationFormattingDetails: Details.Table = {
  type: 'table',
  headings: [
    { key: 'label', label: 'Phase', valueType: 'text' },
    { key: 'duration', label: 'Duration', valueType: 'ms', displayUnit: 'duration' },
  ],
  items: [
    { label: { type: 'text', value: 'Full deploy window' }, duration: 75432 },
    { label: { type: 'text', value: 'Background sync' }, duration: 3661000 },
  ],
};

const autoGroupedEntityTableDetails: Details.Table = {
  type: 'table',
  headings: [
    { key: 'url', label: 'URL', valueType: 'url' },
    { key: 'transferSize', label: 'Transfer Size', valueType: 'bytes' },
    { key: 'wastedMs', label: 'Blocking Time', valueType: 'ms' },
  ],
  sortedBy: ['transferSize'],
  items: [
    {
      url: 'https://deep-blue.io/app.f9df6e.js',
      transferSize: 166921,
      wastedMs: 142,
    },
    {
      url: 'https://deep-blue.io/styles.a61f4c.css',
      transferSize: 104911,
      wastedMs: 48,
    },
    {
      url: 'https://www.googletagmanager.com/gtm.js?id=GTM-XXXX',
      transferSize: 92412,
      wastedMs: 214,
    },
    {
      url: 'https://cdnjs.cloudflare.com/ajax/libs/some-polyfill/4.0.0/polyfill.min.js',
      transferSize: 51444,
      wastedMs: 87,
    },
  ],
};

const preGroupedEntityTableDetails: Details.Table = {
  type: 'table',
  isEntityGrouped: true,
  headings: [
    { key: 'name', label: 'Entity', valueType: 'text' },
    { key: 'transferSize', label: 'Transfer Size', valueType: 'bytes' },
    { key: 'blockingTime', label: 'Blocking Time', valueType: 'ms' },
  ],
  items: [
    {
      name: { type: 'text', value: 'Deep Blue' },
      entity: 'Deep Blue',
      transferSize: 271832,
      blockingTime: 190,
    },
    {
      name: { type: 'text', value: 'Google Tag Manager' },
      entity: 'Google Tag Manager',
      transferSize: 92412,
      blockingTime: 214,
    },
  ],
};

const checklistDetails: Details.Checklist = {
  type: 'checklist',
  items: {
    compression: { value: true, label: 'Text compression is enabled' },
    caching: { value: true, label: 'Static assets use long-lived caching' },
    preconnect: { value: false, label: 'Cross-origin preconnects are configured' },
  },
};

const criticalRequestChainDetails: Details.CriticalRequestChain = {
  type: 'criticalrequestchain',
  longestChain: {
    duration: 722,
    length: 3,
    transferSize: 210341,
  },
  chains: {
    root: {
      request: {
        url: 'https://deep-blue.io/',
        startTime: 0,
        responseReceivedTime: 0.061,
        endTime: 0.074,
        transferSize: 37265,
      },
      children: {
        css: {
          request: {
            url: 'https://deep-blue.io/styles.a61f4c.css',
            startTime: 0.08,
            responseReceivedTime: 0.19,
            endTime: 0.22,
            transferSize: 104911,
          },
          children: {
            font: {
              request: {
                url: 'https://deep-blue.io/fonts/inter-var.woff2',
                startTime: 0.23,
                responseReceivedTime: 0.51,
                endTime: 0.722,
                transferSize: 68165,
              },
            },
          },
        },
      },
    },
  },
};

const networkTreeDetails: Details.NetworkTree = {
  type: 'network-tree',
  longestChain: {
    duration: 1985,
  },
  chains: {
    document: {
      url: 'https://deep-blue.io/',
      navStartToEndTime: 1985,
      transferSize: 37265,
      isLongest: true,
      children: {
        app: {
          url: 'https://deep-blue.io/app.f9df6e.js',
          navStartToEndTime: 1881,
          transferSize: 166921,
          isLongest: true,
        },
        css: {
          url: 'https://deep-blue.io/styles.a61f4c.css',
          navStartToEndTime: 1110,
          transferSize: 104911,
          children: {
            font: {
              url: 'https://deep-blue.io/fonts/inter-var.woff2',
              navStartToEndTime: 978,
              transferSize: 68165,
            },
          },
        },
      },
    },
  },
};

const filmstripDetails: Details.Filmstrip = {
  type: 'filmstrip',
  scale: 3000,
  items: [
    {
      timing: 375,
      timestamp: 203385960945,
      data: svgDataUri('375 ms', '#173b5f'),
    },
    {
      timing: 1125,
      timestamp: 203386710945,
      data: svgDataUri('1125 ms', '#1d6b72'),
    },
    {
      timing: 1875,
      timestamp: 203387460945,
      data: svgDataUri('1875 ms', '#c96b2c'),
    },
  ],
};

const debugDataDetails = {
  type: 'debugdata',
  viewportContent: 'width=device-width, initial-scale=1, shrink-to-fit=no',
} as Details.DebugData;

const screenshotDetails = {
  type: 'screenshot',
  timing: 1970.395,
  timestamp: 203387460945,
  data: svgDataUri('Final screenshot', '#2f7d62'),
} as Details.Screenshot;

const treemapDetails = {
  type: 'treemap-data',
  nodes: [],
} as unknown as Details.TreemapData;

const listDetails: Details.List = {
  type: 'list',
  items: [
    {
      type: 'list-section',
      title: 'Top finding ([guide](https://developer.chrome.com/docs/lighthouse/performance/))',
      description: 'The largest visible issue comes from the hero asset pipeline and is explained in the [performance docs](https://developer.chrome.com/docs/lighthouse/performance/).',
      value: {
        type: 'text',
        value: 'Preloading the LCP image and collapsing duplicate CSS would likely improve both FCP and LCP.',
      },
    },
    {
      type: 'list-section',
      title: 'Affected element',
      description: 'The current viewer uses the same Angular node primitive used in tables.',
      value: {
        type: 'node',
        lhId: 'hero-image',
        selector: 'section.hero img',
        nodeLabel: 'Hero image',
        snippet: '<img alt="Deep Blue hero" src="/hero.webp">',
        explanation: 'Rendered without preload and before dimensions are committed.',
      },
    },
    {
      type: 'list-section',
      title: 'Supporting table',
      description: 'Nested details can contain a full Lighthouse table.',
      value: richTableDetails,
    },
    {
      type: 'list-section',
      title: 'Checklist follow-up',
      description: 'Nested checklist rendering stays inside Angular templates.',
      value: checklistDetails,
    },
    {
      type: 'list-section',
      title: 'Chain context',
      description: 'The same list item can also wrap the network-tree detail type.',
      value: networkTreeDetails,
    },
  ],
};

const deepBlueOverview: DiagnosticItem[] = [
  {
    id: 'unused-css-rules',
    title: 'Reduce unused CSS',
    displayValue: '66,957 bytes',
    description:
      'Reduce unused rules from stylesheets and defer CSS not used for above-the-fold content to decrease bytes consumed by network activity.',
    status: STATUS.ALERT,
    affectedMetrics: ['FCP', 'LCP'],
    details: unusedCssDetails,
  },
  {
    id: 'unused-javascript',
    title: 'Reduce unused JavaScript',
    displayValue: '61,604 bytes',
    description:
      'Reduce unused JavaScript and defer loading scripts until they are required to decrease bytes consumed by network activity.',
    status: STATUS.ALERT,
    affectedMetrics: ['FCP', 'LCP'],
    details: unusedJavascriptDetails,
  },
  {
    id: 'legacy-javascript',
    title: 'Avoid serving legacy JavaScript to modern browsers',
    displayValue: '16,155 bytes',
    description:
      'Polyfills and transforms enable legacy browsers to use newer JavaScript features. Many are not necessary for modern browsers.',
    status: STATUS.WARN,
    details: legacyJavascriptDetails,
  },
  {
    id: 'total-byte-weight',
    title: 'Avoids enormous network payloads',
    displayValue: '489,013 bytes',
    description:
      'Large network payloads cost users real money and are highly correlated with long load times.',
    status: STATUS.INFO,
    details: totalByteWeightDetails,
  },
  {
    id: 'network-rtt',
    title: 'Network Round Trip Times',
    displayValue: '39.893 ms',
    description:
      'Round trip time has a large impact on performance. High RTT often means a geographically distant or slow origin.',
    status: STATUS.INFO,
    details: networkRttDetails,
  },
  {
    id: 'network-server-latency',
    title: 'Server Backend Latencies',
    displayValue: '20.569 ms',
    description:
      'Server latencies can impact web performance. High latency usually points to backend overhead or overloaded infrastructure.',
    status: STATUS.INFO,
    details: networkServerLatencyDetails,
  },
  {
    id: 'viewport',
    title: 'Has a `<meta name="viewport">` tag with `width` or `initial-scale`',
    displayValue: 'width=device-width, initial-scale=1, shrink-to-fit=no',
    description:
      'A viewport meta tag optimizes the page for mobile screens and removes the legacy input delay on tap interactions.',
    status: STATUS.PASS,
    affectedMetrics: ['INP'],
    details: debugDataDetails,
  },
  {
    id: 'is-on-https',
    title: 'Uses HTTPS',
    description:
      'All sites should be protected with HTTPS. It prevents tampering, enables modern web features, and avoids mixed-content issues.',
    status: STATUS.PASS,
    details: {
      type: 'table',
      headings: [
        { key: 'url', valueType: 'url', label: 'Insecure URL' },
        { key: 'resolution', valueType: 'text', label: 'Request Resolution' },
      ],
      items: [],
    } as Details.Table,
  },
];

const unknownDetails = {
  type: 'mystery-data',
  payload: {
    alpha: 1,
    beta: ['one', 'two'],
  },
} as unknown as Details;

const baseItem = (overrides: Partial<DiagnosticItem> & Pick<DiagnosticItem, 'id' | 'title' | 'description' | 'details'>): DiagnosticItem => ({
  status: STATUS.INFO,
  ...overrides,
});

const singleItemStory = (item: DiagnosticItem): Story => ({
  args: {
    items: [item],
    context: deepBlueContext,
  },
});

const meta: Meta<ViewerDiagnosticComponent> = {
  title: 'Patterns/Viewer Diagnostics',
  component: ViewerDiagnosticComponent,
  args: {
    items: deepBlueOverview,
    context: deepBlueContext,
  },
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<ViewerDiagnosticComponent>;

export const DeepBlueOverview: Story = {
  args: {
    items: deepBlueOverview,
  },
};

export const OpportunityType: Story = singleItemStory(
  baseItem({
    id: 'opportunity-type',
    title: 'Opportunity detail type',
    description: 'Matches Lighthouse opportunity tables such as unused CSS and unused JavaScript.',
    details: unusedCssDetails,
  }),
);

export const TableType: Story = singleItemStory(
  baseItem({
    id: 'table-type',
    title: 'Table detail type',
    description: 'Exercises table cell rendering for source locations, nodes, code, links, numerics, and subitems.',
    details: richTableDetails,
  }),
);

export const ListType: Story = singleItemStory(
  baseItem({
    id: 'list-type',
    title: 'List detail type',
    description: 'Shows nested sections, text values, node values, and nested detail blocks.',
    details: listDetails,
  }),
);

export const ChecklistType: Story = singleItemStory(
  baseItem({
    id: 'checklist-type',
    title: 'Checklist detail type',
    description: 'Renders pass or fail checklist items the same way Lighthouse uses them.',
    details: checklistDetails,
  }),
);

export const CriticalRequestChainType: Story = singleItemStory(
  baseItem({
    id: 'critical-request-chain-type',
    title: 'Critical request chain detail type',
    description: 'Represents the legacy Lighthouse critical request chain visualization.',
    details: criticalRequestChainDetails,
  }),
);

export const NetworkTreeType: Story = singleItemStory(
  baseItem({
    id: 'network-tree-type',
    title: 'Network tree detail type',
    description: 'Represents the newer Lighthouse network-tree insight visualization.',
    details: networkTreeDetails,
  }),
);

export const FilmstripType: Story = singleItemStory(
  baseItem({
    id: 'filmstrip-type',
    title: 'Filmstrip detail type',
    description: 'Uses compact screenshot frames to preview the load progression.',
    details: filmstripDetails,
  }),
);

export const AutoGroupedEntityTableType: Story = singleItemStory(
  baseItem({
    id: 'entity-grouped-auto',
    title: 'Auto-grouped entity table',
    description: 'Rows are grouped by entity, summed, adorned, and sorted using Lighthouse-compatible table semantics.',
    details: autoGroupedEntityTableDetails,
  }),
);

export const PreGroupedEntityTableType: Story = singleItemStory(
  baseItem({
    id: 'entity-grouped-pre',
    title: 'Pre-grouped entity table',
    description: 'Already grouped entity rows should retain their heading-row styling and entity adornments.',
    details: preGroupedEntityTableDetails,
  }),
);

export const ThirdPartyFilterType: Story = singleItemStory(
  baseItem({
    id: 'legacy-javascript',
    title: 'Third-party filter behavior',
    description: 'Legacy JavaScript hides third-party resources by default, matching the Lighthouse report viewer.',
    details: legacyJavascriptDetails,
  }),
);

export const DurationFormattingType: Story = singleItemStory(
  baseItem({
    id: 'duration-formatting',
    title: 'Duration formatting',
    description: 'Duration-formatted timing columns should render as compact durations instead of raw milliseconds.',
    details: durationFormattingDetails,
  }),
);

export const NodeScreenshotType: Story = singleItemStory(
  baseItem({
    id: 'node-screenshot',
    title: 'Node screenshot overlay',
    description: 'Node values can render a clipped preview from the full-page screenshot and open a larger overlay on click.',
    details: richTableDetails,
  }),
);

export const UnknownFallbackType: Story = singleItemStory(
  baseItem({
    id: 'unknown-fallback',
    title: 'Unknown detail fallback',
    description: 'Unexpected future detail types should render a readable fallback instead of disappearing silently.',
    details: unknownDetails,
  }),
);

export const DebugDataInternalOnly: Story = singleItemStory(
  baseItem({
    id: 'debugdata-type',
    title: 'Debugdata internal-only type',
    description: 'Lighthouse includes this in the LHR, but its viewer intentionally renders no detail body.',
    details: debugDataDetails,
  }),
);

export const ScreenshotInternalOnly: Story = singleItemStory(
  baseItem({
    id: 'screenshot-type',
    title: 'Screenshot internal-only type',
    description: 'The standalone screenshot detail is internal in Lighthouse and intentionally renders no detail body here as well.',
    details: screenshotDetails,
  }),
);

export const TreemapDataInternalOnly: Story = singleItemStory(
  baseItem({
    id: 'treemap-type',
    title: 'Treemap internal-only type',
    description: 'Treemap data is part of the report payload, but not rendered by the standard Lighthouse detail renderer.',
    details: treemapDetails,
  }),
);
