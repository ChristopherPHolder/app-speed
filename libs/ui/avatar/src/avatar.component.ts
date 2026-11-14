import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type AvatarSize = 'small' | 'medium' | 'large';

/**
 * Identifies a workspace, project or person with an image, falling back to the first letter of the
 * name. It is decorative: the name is always shown next to it.
 */
@Component({
  selector: 'ui-avatar',
  template: `
    @if (image(); as image) {
      <img [src]="image" alt="" />
    } @else {
      {{ initial() }}
    }
  `,
  host: {
    'aria-hidden': 'true',
    '[attr.data-size]': 'size()',
  },
  styles: `
    :host {
      --ui-avatar-size: var(--ui-space-8);
      display: grid;
      flex: none;
      width: var(--ui-avatar-size);
      height: var(--ui-avatar-size);
      overflow: hidden;
      border-radius: var(--mat-sys-corner-small);
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      font: var(--mat-sys-title-medium);
      place-items: center;
    }
    :host([data-size='small']) {
      --ui-avatar-size: var(--ui-space-5);
      border-radius: var(--mat-sys-corner-extra-small);
    }
    :host([data-size='large']) {
      --ui-avatar-size: 56px;
      border-radius: var(--mat-sys-corner-medium);
      font: var(--mat-sys-headline-small);
    }
    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent {
  readonly name = input.required<string>();
  readonly image = input<string | null>(null);
  readonly size = input<AvatarSize>('medium');

  protected readonly initial = computed(() => this.name().trim().slice(0, 1).toUpperCase());
}
