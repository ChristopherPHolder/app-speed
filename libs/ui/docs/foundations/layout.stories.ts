import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { WINDOW_SIZE_CLASS_MIN_WIDTH } from '@app-speed/ui/layout';
import { TokenValueComponent } from '../token-value.component';

const spacing = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16].map((step) => ({ token: `--ui-space-${step}`, step }));

const sizeClasses = [
  {
    name: 'Compact',
    range: '< 600',
    min: WINDOW_SIZE_CLASS_MIN_WIDTH.compact,
    gutter: 16,
    navigation: 'Modal drawer',
    panes: 1,
  },
  {
    name: 'Medium',
    range: '600 – 839',
    min: WINDOW_SIZE_CLASS_MIN_WIDTH.medium,
    gutter: 24,
    navigation: 'Modal drawer',
    panes: 1,
  },
  {
    name: 'Expanded',
    range: '840 – 1199',
    min: WINDOW_SIZE_CLASS_MIN_WIDTH.expanded,
    gutter: 24,
    navigation: 'Standard drawer',
    panes: 2,
  },
  {
    name: 'Large',
    range: '1200 – 1599',
    min: WINDOW_SIZE_CLASS_MIN_WIDTH.large,
    gutter: 24,
    navigation: 'Standard drawer',
    panes: 2,
  },
  {
    name: 'Extra-large',
    range: '≥ 1600',
    min: WINDOW_SIZE_CLASS_MIN_WIDTH.extraLarge,
    gutter: 24,
    navigation: 'Standard drawer',
    panes: 2,
  },
];

const widths = [
  { token: '--ui-page-width-narrow', use: 'Reading and single-column forms' },
  { token: '--ui-page-width-medium', use: 'Builders and settings' },
  { token: '--ui-page-width-wide', use: 'Dashboards, tables, galleries' },
];

const meta: Meta = {
  title: 'Foundations/Layout',
  tags: ['!autodocs'],
  decorators: [moduleMetadata({ imports: [TokenValueComponent] })],
};

export default meta;
type Story = StoryObj;

/** The spacing scale on the 4dp grid. */
export const Spacing: Story = {
  render: () => ({
    props: { spacing },
    template: `
      <div style="display: grid; gap: 8px; padding: 24px;">
        @for (item of spacing; track item.token) {
          <div style="display: grid; grid-template-columns: 140px 56px 1fr; gap: 16px; align-items: center;">
            <code style="font-size: 0.75rem;">{{ item.token }}</code>
            <ui-docs-token-value [token]="item.token" />
            <span style="height: 16px; border-radius: var(--mat-sys-corner-extra-small); background: var(--mat-sys-primary);" [style.width]="'var(' + item.token + ')'"></span>
          </div>
        }
      </div>
    `,
  }),
};

/** Window size classes and what changes at each. */
export const WindowSizeClasses: Story = {
  render: () => ({
    props: { sizeClasses },
    template: `
      <div style="padding: 24px; overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font: var(--mat-sys-body-medium); text-align: left;">
          <thead>
            <tr style="color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-label-large);">
              <th style="padding: 8px 12px;">Class</th>
              <th style="padding: 8px 12px;">Width (px)</th>
              <th style="padding: 8px 12px;">Media query</th>
              <th style="padding: 8px 12px;">Page gutter</th>
              <th style="padding: 8px 12px;">Navigation</th>
              <th style="padding: 8px 12px;">Panes</th>
            </tr>
          </thead>
          <tbody>
            @for (item of sizeClasses; track item.name) {
              <tr style="border-top: 1px solid var(--mat-sys-outline-variant);">
                <td style="padding: 12px;"><strong>{{ item.name }}</strong></td>
                <td style="padding: 12px;">{{ item.range }}</td>
                <td style="padding: 12px;"><code>{{ item.min ? '(width >= ' + item.min + 'px)' : 'default' }}</code></td>
                <td style="padding: 12px;">{{ item.gutter }}</td>
                <td style="padding: 12px;">{{ item.navigation }}</td>
                <td style="padding: 12px;">{{ item.panes }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    `,
  }),
};

/** The three content widths. */
export const ContentWidths: Story = {
  render: () => ({
    props: { widths },
    template: `
      <div style="display: grid; gap: 12px; padding: 24px;">
        @for (item of widths; track item.token) {
          <div
            style="box-sizing: border-box; padding: 12px 16px; border-radius: var(--mat-sys-corner-medium); background: var(--mat-sys-surface-container-high);"
            [style.maxWidth]="'var(' + item.token + ')'"
          >
            <code style="font-size: 0.75rem;">{{ item.token }}</code> · <ui-docs-token-value [token]="item.token" />
            <div style="color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-body-small);">{{ item.use }}</div>
          </div>
        }
      </div>
    `,
  }),
};
