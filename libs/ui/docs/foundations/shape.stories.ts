import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { TokenValueComponent } from '../token-value.component';

const corners = [
  { name: 'none', use: 'Full-bleed regions, table cells' },
  { name: 'extra-small', use: 'Menus, snackbars, tooltips, text fields' },
  { name: 'small', use: 'Chips, small thumbnails' },
  { name: 'medium', use: 'Cards, icon tiles, inline messages' },
  { name: 'large', use: 'FABs, navigation drawer, large tiles' },
  { name: 'extra-large', use: 'Dialogs, sheets, hero panels' },
  { name: 'full', use: 'Buttons, badges, avatars, status chips' },
].map((corner) => ({ ...corner, token: `--mat-sys-corner-${corner.name}` }));

const meta: Meta = {
  title: 'Foundations/Shape',
  tags: ['!autodocs'],
  decorators: [moduleMetadata({ imports: [TokenValueComponent] })],
};

export default meta;
type Story = StoryObj;

/** The corner scale. */
export const CornerScale: Story = {
  render: () => ({
    props: { corners },
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; padding: 24px;">
        @for (corner of corners; track corner.token) {
          <div style="display: grid; gap: 8px;">
            <div
              style="height: 96px; background: var(--mat-sys-primary-container); border: 1px solid var(--mat-sys-outline-variant);"
              [style.borderRadius]="'var(' + corner.token + ')'"
            ></div>
            <strong style="font: var(--mat-sys-label-large); text-transform: capitalize;">{{ corner.name }}</strong>
            <code style="font-size: 0.75rem;">{{ corner.token }}</code>
            <ui-docs-token-value [token]="corner.token" />
            <span style="color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-body-small);">{{ corner.use }}</span>
          </div>
        }
      </div>
    `,
  }),
};
