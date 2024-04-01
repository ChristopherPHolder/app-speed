import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

export const DIAGNOSTIC_ITEM_STATUS = { ALERT: 'alert', WARN: 'warn', INFO: 'info', PASS: 'pass' } as const;
export type DiagnosticItemStatus = typeof DIAGNOSTIC_ITEM_STATUS[keyof typeof DIAGNOSTIC_ITEM_STATUS];

@Component({
  selector: 'lib-viewer-status-badge',
  template: `<mat-icon [style.color]='status().color'>{{status().icon}}</mat-icon>`,
  standalone: true,
  imports: [MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerStatusBadgeComponent {
  status = input.required<{ icon: string; color: string; }, DiagnosticItemStatus>({
    transform: (status: DiagnosticItemStatus) => this.STATUS_BADGE_MAP[status]
  });
  private readonly STATUS_BADGE_MAP = {
    [DIAGNOSTIC_ITEM_STATUS.ALERT]: { icon: 'warning', color: 'red' },
    [DIAGNOSTIC_ITEM_STATUS.WARN]: { icon: 'square', color: 'orange'},
    [DIAGNOSTIC_ITEM_STATUS.INFO]: { icon: 'circle', color: 'gray' },
    [DIAGNOSTIC_ITEM_STATUS.PASS]: { icon: 'square', color: 'green' }
  } as const;
}
