import { MatButton } from '@angular/material/button';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { TokenValueComponent } from '../token-value.component';

const layers = ['hover', 'focus', 'pressed', 'dragged'].map((state) => ({
  state,
  token: `--mat-sys-${state}-state-layer-opacity`,
}));

const meta: Meta = {
  title: 'Foundations/States',
  tags: ['!autodocs'],
  decorators: [moduleMetadata({ imports: [MatButton, TokenValueComponent] })],
};

export default meta;
type Story = StoryObj;

/** State layers: the content colour laid over the container at a fixed opacity. */
export const StateLayers: Story = {
  render: () => ({
    props: { layers },
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; padding: 24px;">
        <div style="display: grid; gap: 8px;">
          <div style="height: 72px; border-radius: var(--mat-sys-corner-medium); background: var(--mat-sys-surface-container-low); border: 1px solid var(--mat-sys-outline-variant);"></div>
          <strong style="font: var(--mat-sys-label-large);">Enabled</strong>
          <span style="color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-body-small);">No layer</span>
        </div>
        @for (layer of layers; track layer.token) {
          <div style="display: grid; gap: 8px;">
            <div
              style="height: 72px; border-radius: var(--mat-sys-corner-medium); border: 1px solid var(--mat-sys-outline-variant);"
              [style.background]="'color-mix(in srgb, var(--mat-sys-on-surface) calc(var(' + layer.token + ') * 100%), var(--mat-sys-surface-container-low))'"
            ></div>
            <strong style="font: var(--mat-sys-label-large); text-transform: capitalize;">{{ layer.state }}</strong>
            <code style="font-size: 0.75rem;">{{ layer.token }}</code>
            <ui-docs-token-value [token]="layer.token" />
          </div>
        }
      </div>
    `,
  }),
};

/** A custom interactive surface built the same way Material components are. Hover, focus and press it. */
export const InteractiveSurface: Story = {
  render: () => ({
    template: `
      <div style="padding: 24px;">
        <a class="ui-docs-surface ui-focus-ring" href="#" (click)="$event.preventDefault()">
          <strong style="font: var(--mat-sys-title-medium);">Interactive card</strong>
          <span style="color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-body-medium);">
            The fill changes through a state layer. Nothing moves and no shadow appears.
          </span>
        </a>
      </div>
    `,
    styles: [
      `
      .ui-docs-surface {
        position: relative;
        display: grid;
        gap: 4px;
        max-width: 360px;
        padding: 16px;
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: var(--mat-sys-corner-medium);
        background: var(--mat-sys-surface);
        color: var(--mat-sys-on-surface);
        text-decoration: none;
      }
      .ui-docs-surface::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: var(--mat-sys-on-surface);
        opacity: 0;
        transition: opacity var(--ui-motion-duration-short3) var(--ui-motion-easing-standard);
        pointer-events: none;
      }
      .ui-docs-surface:hover::before {
        opacity: var(--mat-sys-hover-state-layer-opacity);
      }
      .ui-docs-surface:focus-visible::before {
        opacity: var(--mat-sys-focus-state-layer-opacity);
      }
      .ui-docs-surface:active::before {
        opacity: var(--mat-sys-pressed-state-layer-opacity);
      }
      `,
    ],
  }),
};

/** Disabled controls keep their shape and lose their colour. */
export const Disabled: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 12px; padding: 24px;">
        <button matButton="filled" type="button">Enabled</button>
        <button matButton="filled" type="button" disabled>Disabled</button>
        <button matButton="outlined" type="button" disabled>Disabled</button>
        <button matButton type="button" disabled>Disabled</button>
      </div>
    `,
  }),
};
