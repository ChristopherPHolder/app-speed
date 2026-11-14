import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { TokenValueComponent } from '../token-value.component';

const scale = ['display', 'headline', 'title', 'body', 'label'].flatMap((role) =>
  ['large', 'medium', 'small'].map((size) => ({
    token: `--mat-sys-${role}-${size}`,
    name: `${role} ${size}`,
    sample: role === 'label' ? 'Run audit' : role === 'body' ? 'Measure a complete user journey.' : 'App Speed',
  })),
);

const meta: Meta = {
  title: 'Foundations/Typography',
  tags: ['!autodocs'],
  decorators: [moduleMetadata({ imports: [TokenValueComponent] })],
};

export default meta;
type Story = StoryObj;

/** The fifteen type styles, rendered from the theme. */
export const TypeScale: Story = {
  render: () => ({
    props: { scale },
    template: `
      <div style="display: grid; gap: 16px; padding: 24px;">
        @for (style of scale; track style.token) {
          <div style="display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 24px; align-items: baseline; padding-bottom: 16px; border-bottom: 1px solid var(--mat-sys-outline-variant);">
            <span [style.font]="'var(' + style.token + ')'" [style.letterSpacing]="'var(' + style.token + '-tracking)'" style="overflow-wrap: anywhere;">{{ style.sample }}</span>
            <span style="display: grid; gap: 2px; color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-body-small);">
              <strong style="text-transform: capitalize; color: var(--mat-sys-on-surface);">{{ style.name }}</strong>
              <code>{{ style.token }}</code>
              <span>
                <ui-docs-token-value [token]="style.token + '-size'" /> /
                <ui-docs-token-value [token]="style.token + '-line-height'" /> ·
                <ui-docs-token-value [token]="style.token + '-weight'" />
              </span>
            </span>
          </div>
        }
      </div>
    `,
  }),
};
