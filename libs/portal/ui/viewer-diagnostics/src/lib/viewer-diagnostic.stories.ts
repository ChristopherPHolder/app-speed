import type { Meta, StoryObj } from '@storybook/angular';
import { STATUS } from '@app-speed/portal-ui/status-badge';
import type Details from 'lighthouse/types/lhr/audit-details';
import { DiagnosticItem } from './viewer-diagnostic-panel.component';
import { ViewerDiagnosticComponent } from './viewer-diagnostic.component';

// Derived from the Lighthouse report pasted for https://deep-blue.io/ on 2026-03-07.
const diagnostics: DiagnosticItem[] = [
  {
    id: 'unused-css-rules',
    title: 'Reduce unused CSS',
    displayValue: '66,957 bytes',
    description:
      'Reduce unused rules from stylesheets and defer CSS not used for above-the-fold content to decrease bytes consumed by network activity. [Learn how to reduce unused CSS](https://developer.chrome.com/docs/lighthouse/performance/unused-css-rules/).',
    status: STATUS.ALERT,
    affectedMetrics: ['FCP', 'LCP'],
  },
  {
    id: 'unused-javascript',
    title: 'Reduce unused JavaScript',
    displayValue: '61,604 bytes',
    description:
      'Reduce unused JavaScript and defer loading scripts until they are required to decrease bytes consumed by network activity. [Learn how to reduce unused JavaScript](https://developer.chrome.com/docs/lighthouse/performance/unused-javascript/).',
    status: STATUS.ALERT,
    affectedMetrics: ['FCP', 'LCP'],
  },
  {
    id: 'legacy-javascript',
    title: 'Avoid serving legacy JavaScript to modern browsers',
    displayValue: '16,155 bytes',
    description:
      'Polyfills and transforms enable legacy browsers to use newer JavaScript features. However, many are not necessary for modern browsers. Consider modifying your JavaScript build process to not transpile [Baseline](https://webstatus.dev/?q=baseline_status%3A%22widely%22) features, unless you know you must support legacy browsers. [Learn why most sites can deploy ES6+ code without transpiling](https://philipwalton.com/articles/the-state-of-es5-on-the-web/).',
    status: STATUS.WARN,
  },
  {
    id: 'total-byte-weight',
    title: 'Avoids enormous network payloads',
    displayValue: '489,013 bytes',
    description:
      'Large network payloads cost users real money and are highly correlated with long load times. [Learn how to reduce payload sizes](https://developer.chrome.com/docs/lighthouse/performance/total-byte-weight/).',
    status: STATUS.INFO,
  },
  {
    id: 'network-rtt',
    title: 'Network Round Trip Times',
    displayValue: '39.893 ms',
    description:
      "Network round trip times (RTT) have a large impact on performance. If the RTT to an origin is high, it's an indication that servers closer to the user could improve performance. [Learn more about the Round Trip Time](https://hpbn.co/primer-on-latency-and-bandwidth/).",
    status: STATUS.INFO,
  },
  {
    id: 'network-server-latency',
    title: 'Server Backend Latencies',
    displayValue: '20.569 ms',
    description:
      "Server latencies can impact web performance. If the server latency of an origin is high, it's an indication the server is overloaded or has poor backend performance. [Learn more about server response time](https://hpbn.co/primer-on-web-performance/#analyzing-the-resource-waterfall).",
    status: STATUS.INFO,
  },
  {
    id: 'viewport',
    title: 'Has a `<meta name="viewport">` tag with `width` or `initial-scale`',
    displayValue: 'width=device-width, initial-scale=1, shrink-to-fit=no',
    description:
      'A `<meta name="viewport">` not only optimizes your app for mobile screen sizes, but also prevents [a 300 millisecond delay to user input](https://developer.chrome.com/blog/300ms-tap-delay-gone-away/). [Learn more about using the viewport meta tag](https://developer.chrome.com/docs/lighthouse/pwa/viewport/).',
    status: STATUS.PASS,
    affectedMetrics: ['INP'],
  },
  {
    id: 'is-on-https',
    title: 'Uses HTTPS',
    description:
      "All sites should be protected with HTTPS, even ones that don't handle sensitive data. This includes avoiding [mixed content](https://developers.google.com/web/fundamentals/security/prevent-mixed-content/what-is-mixed-content), where some resources are loaded over HTTP despite the initial request being served over HTTPS. HTTPS prevents intruders from tampering with or passively listening in on the communications between your app and your users, and is a prerequisite for HTTP/2 and many new web platform APIs. [Learn more about HTTPS](https://developer.chrome.com/docs/lighthouse/pwa/is-on-https/).",
    status: STATUS.PASS,
    details: {
      type: 'table',
      headings: [
        { key: 'url', valueType: 'url', label: 'Insecure URL' },
        { key: 'resolution', valueType: 'text', label: 'Request Resolution' },
      ],
      items: [],
    } as Details,
  },
];

const meta: Meta<ViewerDiagnosticComponent> = {
  title: 'Patterns/Viewer Diagnostics',
  component: ViewerDiagnosticComponent,
  args: {
    items: diagnostics,
  },
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<ViewerDiagnosticComponent>;

export const Default: Story = {};
