import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type Details from 'lighthouse/types/lhr/audit-details';

@Component({
  selector: 'ui-viewer-checklist',
  template: `
    <ul class="checklist">
      @for (item of items(); track item.label) {
        <li class="checklist__item">
          <span
            class="checklist__state"
            [class.checklist__state--pass]="item.value"
            [class.checklist__state--fail]="!item.value"
          >
            {{ item.value ? 'Pass' : 'Fail' }}
          </span>
          <span>{{ item.label }}</span>
        </li>
      }
    </ul>
  `,
  styles: `
    .checklist {
      display: grid;
      gap: 10px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .checklist__item {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .checklist__state {
      min-width: 3.75rem;
      padding: 4px 8px;
      border-radius: var(--mat-sys-corner-full);
      font: var(--mat-sys-label-medium);
      text-align: center;
    }

    .checklist__state--pass {
      background: var(--ui-success-container);
      color: var(--ui-on-success-container);
    }

    .checklist__state--fail {
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerChecklistComponent {
  details = input.required<Details.Checklist>();
  readonly items = computed(() => Object.values(this.details().items));
}
