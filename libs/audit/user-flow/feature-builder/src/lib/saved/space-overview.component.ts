import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import type { ManagementOverviewSchema } from '@app-speed/audit/user-flow/api-contract';
@Component({
  selector: 'audit-space-overview',
  imports: [MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './space-overview.component.html',
  styleUrl: './space-overview.component.scss',
})
export class SpaceOverviewComponent {
  readonly view = input.required<typeof ManagementOverviewSchema.Type>();
  protected readonly activeCount = computed(
    () => this.view().schedules.filter((schedule) => schedule.state === 'active').length,
  );
}
