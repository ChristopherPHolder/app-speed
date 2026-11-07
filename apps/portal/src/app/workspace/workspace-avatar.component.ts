import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-workspace-avatar',
  host: { 'aria-hidden': 'true' },
  template: `
    @if (logo(); as image) {
      <img [src]="image" alt="" />
    } @else {
      {{ name().slice(0, 1).toUpperCase() }}
    }
  `,
  styles: `
    :host {
      display: grid;
      flex: none;
      place-items: center;
      width: var(--workspace-avatar-size, 32px);
      height: var(--workspace-avatar-size, 32px);
      overflow: hidden;
      border-radius: var(--workspace-avatar-radius, var(--mat-sys-corner-small));
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      font: var(--workspace-avatar-font, var(--mat-sys-title-medium));
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
export class WorkspaceAvatarComponent {
  readonly name = input.required<string>();
  readonly logo = input<string | null>(null);
}
