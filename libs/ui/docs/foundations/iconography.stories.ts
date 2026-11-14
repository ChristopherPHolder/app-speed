import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

const sizes = [
  { size: 18, use: 'Inside chips and dense rows' },
  { size: 20, use: 'Inside buttons and inline with body text' },
  { size: 24, use: 'Default: icon buttons, lists, navigation' },
  { size: 40, use: 'Tiles and empty states' },
  { size: 48, use: 'Illustrative, one per view' },
];

const meta: Meta = {
  title: 'Foundations/Iconography',
  tags: ['!autodocs'],
  decorators: [moduleMetadata({ imports: [MatIcon, MatIconButton] })],
};

export default meta;
type Story = StoryObj;

/** Icon sizes. */
export const Sizes: Story = {
  render: () => ({
    props: { sizes },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 32px; align-items: end; padding: 24px;">
        @for (item of sizes; track item.size) {
          <div style="display: grid; gap: 8px; justify-items: center; max-width: 140px; text-align: center;">
            <mat-icon aria-hidden="true" [style.width.px]="item.size" [style.height.px]="item.size" [style.fontSize.px]="item.size">speed</mat-icon>
            <strong style="font: var(--mat-sys-label-large);">{{ item.size }}dp</strong>
            <span style="color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-body-small);">{{ item.use }}</span>
          </div>
        }
      </div>
    `,
  }),
};

/** An icon tile: a 24dp icon on a tonal container. */
export const Tile: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px; padding: 24px;">
        <span style="display: grid; place-items: center; width: 48px; height: 48px; border-radius: var(--mat-sys-corner-large); background: var(--mat-sys-primary-container); color: var(--mat-sys-on-primary-container);">
          <mat-icon aria-hidden="true">history</mat-icon>
        </span>
        <span style="display: grid; place-items: center; width: 48px; height: 48px; border-radius: var(--mat-sys-corner-large); background: var(--mat-sys-secondary-container); color: var(--mat-sys-on-secondary-container);">
          <mat-icon aria-hidden="true">construction</mat-icon>
        </span>
      </div>
    `,
  }),
};

/** Icon-only buttons carry an accessible name; decorative icons are hidden. */
export const Labelling: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 8px; align-items: center; padding: 24px;">
        <button matIconButton type="button" aria-label="Refresh audit history"><mat-icon>refresh</mat-icon></button>
        <button matIconButton type="button" aria-label="Copy audit ID"><mat-icon>content_copy</mat-icon></button>
        <button matIconButton type="button" aria-label="More actions"><mat-icon>more_vert</mat-icon></button>
      </div>
    `,
  }),
};
