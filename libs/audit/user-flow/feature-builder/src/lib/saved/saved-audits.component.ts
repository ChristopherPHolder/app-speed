import { SavedEmptyStateComponent } from './saved-empty-state.component';
import { SavedOnboardingComponent } from './saved-onboarding.component';
import { SpaceOverviewComponent } from './space-overview.component';
import { OccurrenceHistoryComponent } from './occurrence-history.component';
import { afterNextRender, ChangeDetectionStrategy, Component, computed, inject, Injector, signal } from '@angular/core';
import { MatAnchor, MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { FormField, form, required } from '@angular/forms/signals';
import { Schema } from 'effect';
import { AuthService } from '@app-speed/platform/auth-portal';
import { RecurrenceSchema } from '@app-speed/audit/core/domain';
import {
  AuditManagementCommand,
  ManagementOverviewSchema,
  OccurrenceHistorySchema,
} from '@app-speed/audit/user-flow/api-contract';
import { firstValueFrom } from 'rxjs';

type Overview = typeof ManagementOverviewSchema.Type;
type Schedule = Overview['schedules'][number];
const initialForm = () => ({
  versionId: '',
  kind: 'interval',
  minutes: '15',
  time: '09:00',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  weekday: '1',
  createdBy: '',
});

@Component({
  selector: 'audit-saved-audits',
  imports: [
    DatePipe,
    RouterLink,
    FormField,
    MatAnchor,
    MatButton,
    MatIconButton,
    MatIcon,
    SavedOnboardingComponent,
    SavedEmptyStateComponent,
    SpaceOverviewComponent,
    OccurrenceHistoryComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './saved-audits.component.html',
  styleUrl: './saved-audits.component.scss',
})
export class SavedAuditsComponent {
  protected readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  protected readonly overview = signal<Overview | null>(null);
  protected readonly history = signal<typeof OccurrenceHistorySchema.Type>([]);
  protected readonly historyId = signal('');
  protected readonly message = signal('');
  protected readonly busy = signal(false);
  protected readonly editingId = signal('');
  protected readonly editorOpen = signal(false);
  protected readonly members = signal<ReadonlyArray<{ id: string; name: string }>>([]);
  private membersRequested = false;
  protected readonly model = signal(initialForm());
  protected readonly scheduleForm = form(this.model, (path) => {
    required(path.versionId);
    required(path.time);
    required(path.timezone);
  });
  protected readonly activeCount = computed(
    () => this.overview()?.schedules.filter((s) => s.state === 'active').length ?? 0,
  );
  protected readonly timezones = Intl.supportedValuesOf('timeZone');
  protected readonly weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
    (label, i) => ({ label, value: String(i + 1) }),
  );
  private originalSchedule: Schedule | null = null;

  constructor() {
    if (this.auth.userId()) void this.refresh();
  }
  private command(command: AuditManagementCommand) {
    return firstValueFrom(this.http.post<unknown>('/api/audits/user-flow/manage', command));
  }
  private async refresh() {
    try {
      this.overview.set(Schema.decodeUnknownSync(ManagementOverviewSchema)(await this.command({ action: 'list' })));
      if (
        this.overview()?.space.kind === 'organization' &&
        this.overview()?.space.role === 'admin' &&
        !this.membersRequested
      ) {
        this.membersRequested = true;
        void this.auth
          .organizationMembers()
          .then((members) => this.members.set(members))
          .catch(() => this.members.set([]));
      }
    } catch {
      this.message.set('Unable to load this space. Check your access and try again.');
    }
  }
  protected canManage(creator: string | null) {
    const view = this.overview();
    return view?.space.role === 'admin' || view?.space.userId === creator;
  }
  protected versions(templateId: string) {
    return this.overview()?.versions.filter((v) => v.templateId === templateId) ?? [];
  }
  protected title(templateId: string) {
    return this.overview()?.templates.find((t) => t.id === templateId)?.title ?? 'Audit';
  }
  protected versionNumber(versionId: string) {
    const version = this.overview()?.versions.find((v) => v.id === versionId);
    if (!version) return '—';
    const versions = this.versions(version.templateId);
    return versions.length - versions.findIndex((v) => v.id === versionId);
  }
  protected managerLabel(userId: string) {
    return this.overview()?.space.userId === userId
      ? 'You'
      : (this.members().find((member) => member.id === userId)?.name ?? 'Assigned member');
  }
  protected closeEditor() {
    this.editorOpen.set(false);
    this.resetEditor();
  }
  protected newSchedule() {
    this.resetEditor();
    this.revealEditor();
  }
  private revealEditor() {
    this.editorOpen.set(true);
    afterNextRender(
      () => {
        const editor = document.getElementById('schedule-editor');
        editor?.querySelector('select')?.focus({ preventScroll: true });
        if (window.innerWidth <= 760) editor?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
      { injector: this.injector },
    );
  }
  protected dueLabel(schedule: Schedule) {
    const timezone = schedule.recurrence.kind === 'interval' ? 'UTC' : schedule.recurrence.timezone;
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'long', timeZone: timezone }).format(
      new Date(schedule.nextDueAt),
    );
  }
  protected recurrenceLabel(schedule: Schedule) {
    const r = schedule.recurrence;
    return r.kind === 'interval'
      ? `Every ${r.minutes} minutes (elapsed time)`
      : `${r.kind === 'weekly' ? this.weekdays[r.weekday - 1]?.label : 'Daily'} at ${r.time} (${r.timezone})`;
  }
  protected chooseVersion(versionId: string) {
    this.resetEditor();
    this.revealEditor();
    this.model.update((m) => ({ ...m, versionId }));
  }
  protected edit(templateId: string, definition: unknown) {
    void this.router.navigate(['/audits/user-flow'], {
      queryParams: { templateId, 'audit-details': JSON.stringify(definition) },
    });
  }
  protected async mutate(command: AuditManagementCommand) {
    this.busy.set(true);
    this.message.set('');
    try {
      await this.command(command);
      await this.refresh();
      this.message.set('Saved.');
      return true;
    } catch {
      this.message.set('Unable to save. Check your permissions, pinned version, and active schedule limit.');
      return false;
    } finally {
      this.busy.set(false);
    }
  }
  protected async run(versionId: string) {
    this.busy.set(true);
    try {
      const run = Schema.decodeUnknownSync(Schema.Struct({ runId: Schema.String }))(
        await this.command({ action: 'run', versionId }),
      );
      await this.router.navigate(['/audits/user-flow', run.runId]);
    } catch {
      this.message.set('Unable to queue this version.');
    } finally {
      this.busy.set(false);
    }
  }
  protected async showHistory(scheduleId: string) {
    try {
      this.history.set(
        Schema.decodeUnknownSync(OccurrenceHistorySchema)(await this.command({ action: 'occurrences', scheduleId })),
      );
      this.historyId.set(scheduleId);
    } catch {
      this.message.set('Unable to load occurrence history.');
    }
  }
  protected resetEditor() {
    this.editingId.set('');
    this.originalSchedule = null;
    this.model.set(initialForm());
  }
  protected editSchedule(schedule: Schedule) {
    this.revealEditor();
    this.editingId.set(schedule.id);
    this.originalSchedule = schedule;
    const r = schedule.recurrence;
    this.model.set({
      ...initialForm(),
      versionId: schedule.versionId,
      kind: r.kind,
      minutes: r.kind === 'interval' ? String(r.minutes) : '15',
      time: r.kind === 'interval' ? '09:00' : r.time,
      timezone: r.kind === 'interval' ? initialForm().timezone : r.timezone,
      weekday: r.kind === 'weekly' ? String(r.weekday) : '1',
      createdBy: schedule.createdBy,
    });
  }
  protected async saveSchedule(event: Event) {
    event.preventDefault();
    const m = this.model();
    try {
      const recurrence = Schema.decodeUnknownSync(RecurrenceSchema)(
        m.kind === 'interval'
          ? { kind: m.kind, minutes: Number(m.minutes) }
          : m.kind === 'weekly'
            ? { kind: m.kind, time: m.time, timezone: m.timezone, weekday: Number(m.weekday) }
            : { kind: m.kind, time: m.time, timezone: m.timezone },
      );
      const original = this.originalSchedule;
      const previous = original?.recurrence;
      const sameRecurrence =
        previous?.kind === recurrence.kind &&
        (recurrence.kind === 'interval'
          ? previous.kind === 'interval' && previous.minutes === recurrence.minutes
          : previous.kind !== 'interval' &&
            previous.time === recurrence.time &&
            previous.timezone === recurrence.timezone &&
            (recurrence.kind !== 'weekly' || (previous.kind === 'weekly' && previous.weekday === recurrence.weekday)));
      const saved = await this.mutate(
        this.editingId()
          ? {
              action: 'updateSchedule',
              scheduleId: this.editingId(),
              versionId: m.versionId,
              ...(!sameRecurrence ? { recurrence } : {}),
              ...(m.createdBy && m.createdBy !== original?.createdBy ? { createdBy: m.createdBy } : {}),
            }
          : { action: 'createSchedule', versionId: m.versionId, recurrence },
      );
      if (saved) this.closeEditor();
    } catch {
      this.message.set('Choose a valid recurrence, local time, and IANA timezone.');
    }
  }
}
