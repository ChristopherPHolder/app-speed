import { Component, computed, input } from '@angular/core';
import { MatChip, MatChipAvatar } from '@angular/material/chips';
import { StatusBadgeComponent } from '@app-speed/portal-ui/status-badge';

@Component({
  selector: 'ui-fractional-result-chip',
  template: `
    <mat-chip [disableRipple]="true" [class]="status()">
      <ui-status-badge [status]="status()" matChipAvatar style="display: contents;" />
      {{ results().numPassed }} / {{ results().numPassableAudits }}
    </mat-chip>
  `,
  imports: [MatChip, StatusBadgeComponent, MatChipAvatar],
  styles: `
    .warn {
      --mdc-chip-elevated-container-color: rgba(255, 170, 51, 0.2);
    }
    .pass {
      --mdc-chip-elevated-container-color: rgba(20, 136, 0, 0.2);
    }
    .alert {
      --mdc-chip-elevated-container-color: rgba(204, 0, 0, 0.2);
    }
  `,
})
export class FractionalResultChipComponent {
  results = input.required<{
    numPassed: number;
    numPassableAudits: number;
    numInformative: number;
    totalWeight: number;
  }>();
  displayValue = computed(() => {
    const { numPassed, numPassableAudits } = this.results();

    return `${numPassed} / ${numPassableAudits}`;
  });
  status = computed(() => {
    const { numPassed, numPassableAudits } = this.results();
    const score = parseInt(((numPassed / numPassableAudits || 0) * 100).toFixed(0), 10);
    if (score > 90) return 'pass';
    if (score > 50) return 'warn';
    return 'alert';
  });
}
