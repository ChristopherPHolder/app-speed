import { type Meta, type StoryObj } from '@storybook/angular';

const levels = [
  { level: 0, use: 'Page, cards, lists, tables — most of the UI' },
  { level: 1, use: 'Elevated cards, a sticky bar over scrolling content' },
  { level: 2, use: 'Menus, selects, autocomplete panels' },
  { level: 3, use: 'Dialogs, FABs, floating banners' },
  { level: 4, use: 'Hover or focus on a level 3 surface' },
  { level: 5, use: 'A surface being dragged' },
];

const meta: Meta = {
  title: 'Foundations/Elevation',
  tags: ['!autodocs'],
};

export default meta;
type Story = StoryObj;

/** The six elevation levels. */
export const Levels: Story = {
  render: () => ({
    props: { levels },
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 32px; padding: 32px; background: var(--mat-sys-surface-container-low);">
        @for (item of levels; track item.level) {
          <div
            style="display: grid; gap: 4px; align-content: end; min-height: 112px; padding: 16px; border-radius: var(--mat-sys-corner-medium); background: var(--mat-sys-surface);"
            [style.boxShadow]="'var(--mat-sys-level' + item.level + ')'"
          >
            <strong style="font: var(--mat-sys-title-medium);">Level {{ item.level }}</strong>
            <code style="font-size: 0.75rem;">--mat-sys-level{{ item.level }}</code>
            <span style="color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-body-small);">{{ item.use }}</span>
          </div>
        }
      </div>
    `,
  }),
};

/** Separating regions with tone instead of shadow. */
export const TonalSurfaces: Story = {
  render: () => ({
    template: `
      <div style="padding: 24px; background: var(--mat-sys-surface);">
        <div style="padding: 24px; border-radius: var(--mat-sys-corner-extra-large); background: var(--mat-sys-surface-container-low);">
          <p style="margin: 0 0 16px; font: var(--mat-sys-title-medium);">surface-container-low on surface</p>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;">
            <div style="padding: 16px; border-radius: var(--mat-sys-corner-medium); background: var(--mat-sys-surface);">surface</div>
            <div style="padding: 16px; border-radius: var(--mat-sys-corner-medium); background: var(--mat-sys-surface-container-high);">surface-container-high</div>
            <div style="padding: 16px; border-radius: var(--mat-sys-corner-medium); border: 1px solid var(--mat-sys-outline-variant);">outline-variant border</div>
          </div>
        </div>
      </div>
    `,
  }),
};
