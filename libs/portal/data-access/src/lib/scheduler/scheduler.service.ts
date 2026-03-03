import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, filter, fromEvent, map, Subject, takeUntil } from 'rxjs';

type AuditResultResponse =
  | { status: 'SUCCESS'; result: unknown }
  | { status: 'FAILURE'; error: { name: string; message: string; stack: string } };

type AuditStage = 'scheduling' | 'scheduled' | 'running' | 'done' | 'failed';

const NO_DISPLAY_STAGES: AuditStage[] = ['done'];

@Injectable({ providedIn: 'root' })
export class SchedulerService {
  private eventSource: EventSource | null = null;
  private readonly disconnect$ = new Subject<void>();
  private readonly http = inject(HttpClient);

  private readonly stage$ = new BehaviorSubject<AuditStage>('scheduling');
  private readonly queuePosition$ = new BehaviorSubject<number | null>(null);
  private readonly resultKey$ = new BehaviorSubject<string | null>(null);

  readonly stageName$ = this.stage$.asObservable();
  readonly shouldDisplayIndicator$ = this.stageName$.pipe(map((stage) => !NO_DISPLAY_STAGES.includes(stage)));
  readonly key$ = this.resultKey$.pipe(filter((key): key is string => key !== null));

  private finalizeWithStatus(auditId: string, status: 'SUCCESS' | 'FAILURE') {
    this.stage$.next(status === 'SUCCESS' ? 'done' : 'failed');
    this.resultKey$.next(auditId);
    this.eventSource?.close();
  }

  private fetchResultAndFinalize(auditId: string) {
    this.http.get<AuditResultResponse>(`/api/audit/${auditId}/result`).subscribe({
      next: (result) => this.finalizeWithStatus(auditId, result.status),
      error: () => {
        this.stage$.next('failed');
        this.resultKey$.next(auditId);
        this.eventSource?.close();
      },
    });
  }

  watchAudit(auditId: string) {
    this.stage$.next('scheduling');
    this.queuePosition$.next(null);
    this.resultKey$.next(null);

    this.disconnect$.next();
    this.eventSource?.close();

    const source = new EventSource(`/api/audit/${auditId}/events`);
    this.eventSource = source;

    fromEvent<MessageEvent>(source, 'position')
      .pipe(
        map((event) => JSON.parse(event.data) as { position: number }),
        takeUntil(this.disconnect$),
      )
      .subscribe(({ position }) => this.queuePosition$.next(position));

    fromEvent<MessageEvent>(source, 'status')
      .pipe(
        map((event) => JSON.parse(event.data) as { status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETE' }),
        takeUntil(this.disconnect$),
      )
      .subscribe(({ status }) => {
        if (status === 'SCHEDULED') this.stage$.next('scheduled');
        if (status === 'IN_PROGRESS') this.stage$.next('running');
        if (status === 'COMPLETE') this.fetchResultAndFinalize(auditId);
      });

    fromEvent<MessageEvent>(source, 'result')
      .pipe(
        map((event) => JSON.parse(event.data) as { status: 'SUCCESS' | 'FAILURE' }),
        takeUntil(this.disconnect$),
      )
      .subscribe(({ status }) => {
        this.finalizeWithStatus(auditId, status);
      });

    fromEvent<Event>(source, 'error')
      .pipe(takeUntil(this.disconnect$))
      .subscribe(() => {
        if (this.stage$.value !== 'done') {
          this.stage$.next('failed');
        }
      });
  }
}
