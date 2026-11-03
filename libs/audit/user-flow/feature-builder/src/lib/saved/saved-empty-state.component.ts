import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatAnchor } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'audit-saved-empty-state',
  imports: [MatAnchor, MatIcon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './saved-empty-state.component.scss',
  template: `<div class="empty-state" [class.compact]="compact()">
    <span class="empty-icon"
      ><mat-icon>{{ icon() }}</mat-icon></span
    >
    <h3>{{ heading() }}</h3>
    <p>{{ description() }}</p>
    @if (buildLink()) {
      <a mat-stroked-button routerLink="/audits/user-flow">Build an audit<mat-icon>arrow_forward</mat-icon></a>
    }
  </div>`,
})
export class SavedEmptyStateComponent {
  readonly icon = input.required<string>();
  readonly heading = input.required<string>();
  readonly description = input.required<string>();
  readonly compact = input(false);
  readonly buildLink = input(false);
}
