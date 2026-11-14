import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { type Meta, type StoryObj } from '@storybook/angular';
import { TokenValueComponent } from '../token-value.component';

const easings = [
  { name: 'emphasized', use: 'Most transitions that start and end on screen' },
  { name: 'emphasized-decelerate', use: 'Entering the screen' },
  { name: 'emphasized-accelerate', use: 'Leaving the screen' },
  { name: 'standard', use: 'Small utility transitions: colour, opacity' },
  { name: 'standard-decelerate', use: 'Small elements entering' },
  { name: 'standard-accelerate', use: 'Small elements leaving' },
].map((easing) => ({ ...easing, token: `--ui-motion-easing-${easing.name}` }));

const durations = ['short', 'medium', 'long'].flatMap((group) =>
  [1, 2, 3, 4].map((step) => ({ token: `--ui-motion-duration-${group}${step}`, name: `${group}${step}` })),
);

@Component({
  selector: 'ui-docs-motion-demo',
  imports: [MatButton, TokenValueComponent],
  template: `
    <div class="demo">
      <button matButton="tonal" type="button" (click)="moved.set(!moved())">Play</button>
      @for (easing of easings; track easing.token) {
        <div class="row">
          <div class="label">
            <strong>{{ easing.name }}</strong>
            <code>{{ easing.token }}</code>
            <span>{{ easing.use }}</span>
          </div>
          <div class="track">
            <span
              class="dot"
              [class.dot--moved]="moved()"
              [style.transitionTimingFunction]="'var(' + easing.token + ')'"
            ></span>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .demo {
      display: grid;
      gap: var(--ui-space-4);
      padding: var(--ui-space-6);
    }
    button {
      justify-self: start;
    }
    .row {
      display: grid;
      grid-template-columns: minmax(0, 320px) 1fr;
      gap: var(--ui-space-6);
      align-items: center;
    }
    .label {
      display: grid;
      gap: 2px;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }
    .label strong {
      font: var(--mat-sys-label-large);
      color: var(--mat-sys-on-surface);
    }
    .track {
      height: var(--ui-space-6);
      border-radius: var(--mat-sys-corner-full);
      background: var(--mat-sys-surface-container-high);
    }
    .dot {
      display: block;
      width: var(--ui-space-6);
      height: var(--ui-space-6);
      border-radius: var(--mat-sys-corner-full);
      background: var(--mat-sys-primary);
      transition: margin-inline-start var(--ui-motion-duration-long2);
    }
    .dot--moved {
      margin-inline-start: calc(100% - var(--ui-space-6));
    }
    @media (prefers-reduced-motion: reduce) {
      .dot {
        transition-duration: 0s;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MotionDemoComponent {
  protected readonly easings = easings;
  protected readonly moved = signal(false);
}

const meta: Meta = {
  title: 'Foundations/Motion',
  tags: ['!autodocs'],
};

export default meta;
type Story = StoryObj;

/** Press Play to compare the easings over the same distance and duration. */
export const Easing: Story = {
  render: () => ({
    moduleMetadata: { imports: [MotionDemoComponent] },
    template: `<ui-docs-motion-demo />`,
  }),
};

/** The duration scale. */
export const Durations: Story = {
  render: () => ({
    props: { durations },
    moduleMetadata: { imports: [TokenValueComponent] },
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px 24px; padding: 24px;">
        @for (item of durations; track item.token) {
          <div style="display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--mat-sys-outline-variant);">
            <code style="font-size: 0.75rem;">{{ item.token }}</code>
            <ui-docs-token-value [token]="item.token" />
          </div>
        }
      </div>
    `,
  }),
};
