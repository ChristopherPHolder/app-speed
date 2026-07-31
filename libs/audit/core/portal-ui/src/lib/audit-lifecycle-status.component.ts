import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

export type AuditLifecycleStage = 'scheduling' | 'scheduled' | 'running' | 'done' | 'failed';

@Component({
  selector: 'ui-audit-lifecycle-status',
  imports: [MatProgressSpinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-testid="audit-progress-status" role="status" aria-live="polite">
      @if (stage() !== 'done' && stage() !== 'failed') {
        <mat-spinner diameter="48" />
      }
      <h1>{{ title() }}</h1>
      <p>{{ detail() }}</p>
      <small>Audit ID: {{ auditId() }}</small>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }
    section {
      display: grid;
      justify-items: center;
      gap: 12px;
      min-height: 280px;
      align-content: center;
      text-align: center;
    }
    h1,
    p {
      margin: 0;
    }
  `,
})
export class AuditLifecycleStatusComponent {
  readonly auditId = input.required<string>();
  readonly stage = input.required<AuditLifecycleStage>();
  readonly queuePosition = input<number | null>(null);

  readonly title = computed(() => {
    switch (this.stage()) {
      case 'scheduling':
      case 'scheduled':
        return 'Audit queued';
      case 'running':
        return 'Audit running';
      case 'failed':
        return 'Audit failed';
      case 'done':
        return 'Audit complete';
    }
  });

  readonly detail = computed(() => {
    if (this.stage() === 'scheduled' || this.stage() === 'scheduling') {
      const position = this.queuePosition();
      if (position === null) return 'Waiting for queue status.';
      if (position === 0) return 'Next in queue. Waiting for a runner.';
      return `${position} ${position === 1 ? 'audit is' : 'audits are'} ahead in queue.`;
    }
    if (this.stage() === 'running') return 'A runner is executing this user flow.';
    if (this.stage() === 'failed') return 'The runner could not complete this user flow.';
    return 'Results are ready.';
  });
}
