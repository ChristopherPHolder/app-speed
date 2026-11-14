import type { Meta, StoryObj } from '@storybook/angular';
import { ProseComponent } from './prose.component';

const meta: Meta<ProseComponent> = {
  title: 'Components/Prose',
  component: ProseComponent,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Typography for long-form reading content written as plain HTML, such as the legal pages. Place it in a ' +
          '`ui-page` with `width="narrow"` under the page header. It styles `h2`, `h3`, paragraphs, lists, ' +
          'definition lists, addresses, links and tables. Wrap tables in `.ui-prose-table` so they scroll sideways ' +
          'in compact windows.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<ProseComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <ui-prose>
        <p>This policy explains which data the service processes, why, and which rights you have.</p>
        <h2>Who is responsible</h2>
        <address>Jane Example<br />Example Street 1, 1010 Vienna, Austria<br /><a href="mailto:jane@example.com">jane@example.com</a></address>
        <h2>Running audits</h2>
        <p>When you run an audit, the service stores the URL and the steps you submit.</p>
        <ul>
          <li><strong>Audits run without signing in are public.</strong> Anyone can see them.</li>
          <li>Audits in a workspace project are visible to its members.</li>
        </ul>
        <h3>Details</h3>
        <dl>
          <dt>Legal basis</dt>
          <dd>Providing the service you requested.</dd>
          <dt>Retention</dt>
          <dd>Until you ask for deletion.</dd>
        </dl>
      </ui-prose>
    `,
  }),
};

/** Tables scroll sideways inside `.ui-prose-table` instead of widening the page. */
export const WithTable: Story = {
  render: () => ({
    template: `
      <ui-prose>
        <h2>Cookies and browser storage</h2>
        <div class="ui-prose-table">
          <table>
            <thead><tr><th scope="col">Name</th><th scope="col">Purpose</th><th scope="col">Lifetime</th></tr></thead>
            <tbody>
              <tr><td><code>example.consent.v1</code> (local storage)</td><td>Remembers your analytics choice.</td><td>180 days</td></tr>
              <tr><td><code>_ga</code></td><td>Distinguishes visits for analytics. Only with your consent.</td><td>180 days</td></tr>
            </tbody>
          </table>
        </div>
      </ui-prose>
    `,
  }),
};
