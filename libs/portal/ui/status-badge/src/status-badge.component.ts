import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { STATUS_COLOR, STATUS_ICON } from './status-badge.constants';
import { StatusOptions } from './status-badge.types';

type StatusBadge = { icon: string; color: string };
const statusBadgeMap = (status: StatusOptions) => ({ icon: STATUS_ICON[status], color: STATUS_COLOR[status] });

@Component({
  selector: 'ui-status-badge',
  template: `<mat-icon [inline]="true" [style.color]="status().color">{{ status().icon }}</mat-icon>`,
  styles: `
    :host {
      display: inherit;
    }
  `,
  imports: [MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  status = input.required<StatusBadge, StatusOptions>({ transform: statusBadgeMap });
}
