import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { STATUS, STATUS_ICON, type StatusOptions } from '@app-speed/ui/status-badge';
import { StatusChipComponent, type StatusTone } from '@app-speed/ui/status-chip';

const STATUS_TONE: Record<StatusOptions, StatusTone> = {
  [STATUS.PASS]: 'success',
  [STATUS.WARN]: 'warning',
  [STATUS.ALERT]: 'error',
  [STATUS.INFO]: 'neutral',
};

@Component({
  selector: 'ui-fractional-result-chip',
  template: `
    <ui-status-chip [tone]="tone()" [icon]="icon()">
      {{ results().numPassed }} / {{ results().numPassableAudits }}
    </ui-status-chip>
  `,
  imports: [StatusChipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FractionalResultChipComponent {
  results = input.required<{
    numPassed: number;
    numPassableAudits: number;
    numInformative: number;
    totalWeight: number;
  }>();
  status = computed<StatusOptions>(() => {
    const { numPassed, numPassableAudits } = this.results();
    const score = parseInt(((numPassed / numPassableAudits || 0) * 100).toFixed(0), 10);
    if (score > 90) return STATUS.PASS;
    if (score > 50) return STATUS.WARN;
    return STATUS.ALERT;
  });
  protected readonly tone = computed(() => STATUS_TONE[this.status()]);
  protected readonly icon = computed(() => STATUS_ICON[this.status()]);
}
