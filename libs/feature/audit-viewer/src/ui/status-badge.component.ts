import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { STATUS_COLOR, STATUS_ICON } from './status.constants';
import { StatusOptions } from './status.types';

@Component({
  selector: 'viewer-status-badge',
  template: `<mat-icon [style.color]='status().color'>{{status().icon}}</mat-icon>`,
  styles: `:host { display: inherit }`,
  standalone: true,
  imports: [MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusBadgeComponent {
  status = input.required<{ icon: string; color: string; }, StatusOptions>({
    transform: (status: StatusOptions) => ({ icon: STATUS_ICON[status], color: STATUS_COLOR[status] })
  });
}
